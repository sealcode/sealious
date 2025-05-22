import type {
	App,
	Field,
	Context,
	ValidationResult,
	Collection,
	CollectionItem,
	ExtractFieldInput,
} from "../../../main.js";
import ItemList from "../../../chip-types/item-list.js";
import { BadContext } from "../../../response/errors.js";
import isEmpty from "../../../utils/is-empty.js";
import HybridField from "../../../chip-types/field-hybrid.js";

import {
	CollectionRefreshCondition,
	RefreshCondition,
} from "../../event-description.js";
import DerivedValue from "./derived-value.js";

type GetValue<DecodedValue> = (
	context: Context,
	item: CollectionItem
) => Promise<DecodedValue>;

type CachedValueSettings<InputType, DecodedType> = {
	refresh_on: RefreshCondition[];
	get_value: GetValue<DecodedType>;
	initial_value: InputType | null;
	derive_from?: string[];
};

export default class CachedValue<
	DecodedType,
	StorageType,
	T extends Field<any, any, any>,
> extends HybridField<
	DecodedType,
	ExtractFieldInput<T>,
	{ timestamp: number; value: StorageType },
	DecodedType,
	ExtractFieldInput<T>,
	StorageType,
	T
> {
	typeName = "cached-value";

	app: App;
	base_field: T;
	refresh_on: RefreshCondition[];
	get_value: GetValue<DecodedType>;
	hasDefaultValue: () => true;
	private initial_value: ExtractFieldInput<T> | null;
	private virtual_derived: DerivedValue<
		DecodedType,
		ExtractFieldInput<T>,
		T
	> | null = null; // sometimes it's necessary to have a field react to both the changes in local fields, as well as changes in cron/another collection

	constructor(
		base_field: T,
		public params: CachedValueSettings<ExtractFieldInput<T>, DecodedType>
	) {
		super(base_field);
		super.setParams(params);
		this.refresh_on = params.refresh_on;
		this.base_field = base_field;
	}

	async init(app: App, collection: Collection): Promise<void> {
		this.get_value = this.params.get_value;
		this.initial_value = this.params.initial_value;
		if (this.params.derive_from) {
			this.virtual_derived = new DerivedValue(this.base_field, {
				fields: this.params.derive_from,
				deriving_fn: this.params.get_value,
			});
		}
		await super.init(app, collection);
		await this.virtual_field.init(app, collection);
		await this.virtual_derived?.init(app, collection);
		this.checkForPossibleRecursiveEdits();

		const create_action = this.refresh_on.find((condition) => {
			return (
				condition instanceof CollectionRefreshCondition &&
				condition.event_names.some((name) => name.includes("create"))
			);
		});

		if (
			create_action &&
			create_action instanceof CollectionRefreshCondition
		) {
			app.on("started", () =>
				this.refresh_outdated_cache_values(app, create_action)
			);
		}

		for (const condition of this.refresh_on) {
			condition.attachTo(app, this.collection, async (arg) => {
				const cache_resource_ids =
					await condition.resource_id_getter(arg);

				if (!Array.isArray(cache_resource_ids)) {
					throw new Error(
						`resource_id_getter return value should be an array of strings, got: ${JSON.stringify(
							cache_resource_ids
						)}`
					);
				}

				app.Logger.debug3("CACHED VALUE", "Inside hook", {
					cache_resource_ids,
				});
				const promises = [];
				const context = arg[0];
				const { items } = await this.collection
					.list(context)
					.ids(cache_resource_ids)
					.fetch();

				const collection =
					context.app.collections[this.collection.name];

				for (const item of items) {
					if (collection) {
						promises.push(
							this.get_value(context, item).then(
								async (value) => {
									const su_item = await collection.suGetByID(
										item.id
									);
									su_item.set(this.name, value);
									await su_item.save(new app.SuperContext());
								}
							)
						);
					} else {
						throw new Error("Collection is missing");
					}
				}
				await Promise.all(promises);
			});
		}
	}

	checkForPossibleRecursiveEdits(): void {
		const doesAnyMatches = this.refresh_on.some(
			(condition) =>
				condition instanceof CollectionRefreshCondition &&
				condition.collection_name === this.collection.name
		);
		if (doesAnyMatches) {
			throw new Error(
				"In the " +
					this.collection.name +
					" collection definition you've tried to create the " +
					this.name +
					" cached-value field that refers to the collection itself. Consider using 'derived-value' field type to avoid problems with endless recurrence."
			);
		}
	}

	private async refresh_outdated_cache_values(
		app: App,
		condition: CollectionRefreshCondition
	) {
		const referenced_collection_name = condition.collection_name;
		app.Logger.debug3(
			"CACHED VALUE",
			`Finding resources without cached value for field ${this.collection.name}.${this.name}. For this, we're looking for items from ${referenced_collection_name} and we'll be looking at them newest-to-oldest.`
		);

		const collection = this.app.collections[referenced_collection_name];

		if (!collection) {
			throw new Error("referenced collection is missing");
		}

		const response = await new ItemList(
			collection,
			new this.app.SuperContext()
		)
			.sort({ "_metadata.modified_at": "desc" })
			.paginate({ items: 1 })
			.fetch();

		if (response.empty) {
			return;
		}

		const responseItem = response.items[0];

		if (!responseItem) {
			throw new Error("item is missing");
		}

		const last_modified_timestamp = responseItem._metadata.modified_at;
		app.Logger.debug3(
			"CACHED VALUE",
			`Continuing searching for resources without cached value for field ${this.collection.name}.${this.name}. Now, we find resources that are potentially outdated.`
		);

		const outdated_resource_bodies = await this.app.Datastore.aggregate(
			this.collection.name,
			[
				{
					$match: {
						$or: [
							{
								[`${this.name}.timestamp`]: {
									$lt: last_modified_timestamp,
								},
							},
							{ [this.name]: { $exists: false } },
						],
					},
				},
			]
		);

		this.app.Logger.debug3(
			"CACHED",
			"Outdated items",
			outdated_resource_bodies
		);

		if (!outdated_resource_bodies) {
			return;
		}

		const su_context = new this.app.SuperContext();
		const { items } = await this.collection
			.suList()
			.ids(outdated_resource_bodies.map((b: { id: string }) => b.id))
			.fetch();
		for (const item of items) {
			const value = await this.get_value(su_context, item);
			const cache_value = await this.encode(su_context, value as any);
			this.app.Logger.debug3(
				"CACHED",
				`New value for item ${item.id}.${this.name}`,
				value
			);
			await this.app.Datastore.update(
				this.collection.name,
				{ id: item.id },
				{ $set: { [this.name]: cache_value } }
			);
		}
	}

	async getDefaultValue(_: Context) {
		return this.initial_value;
	}

	async encode(context: Context, new_value: ExtractFieldInput<T>) {
		const encoded_value = await super.encode(context, new_value);
		const ret = { timestamp: Date.now(), value: encoded_value };
		context.app.Logger.debug3("CACHED VALUE", "Encode", { new_value, ret });
		return ret as any;
	}

	async decode(
		context: Context,
		db_value: { timestamp: number; value: StorageType },
		old_value: any,
		format: any
	) {
		return super.decode(context, db_value.value as any, old_value, format);
	}

	async isProperValue(
		context: Context,
		new_value: Parameters<T["checkValue"]>[1],
		old_value: Parameters<T["checkValue"]>[2],
		new_value_blessing_token: symbol | null
	): Promise<ValidationResult> {
		if (this.virtual_derived) {
			return this.virtual_derived.isProperValue(
				context,
				new_value,
				old_value,
				new_value_blessing_token
			);
		}
		if (!isEmpty(new_value) && !context.is_super) {
			throw new BadContext("This is a read-only field");
		}
		return this.virtual_field.checkValue(
			context,
			new_value,
			old_value,
			new_value_blessing_token
		);
	}

	async getValuePath(): Promise<string> {
		return `${this.name}.value`;
	}

	setName(name: string): void {
		super.setName(name);
		this.virtual_derived?.setName(name);
	}

	getPostgreSqlFieldDefinitions(): string[] {
		const baseFieldsDefs = this.base_field.getPostgreSqlFieldDefinitions();
		return [...baseFieldsDefs, `"${this.name}:timestamp" TIMESTAMP`];
	}
}
