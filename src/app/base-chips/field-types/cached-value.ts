import type { App, Field, Context, CollectionItem } from "../../../main";
import HybridField from "../../../chip-types/field-hybrid";
import ItemList from "../../../chip-types/item-list";
import type { EventDescription } from "../../delegate-listener";
import { BadContext } from "../../../response/errors";
import isEmpty from "../../../utils/is-empty";

export type RefreshCondition = {
	event: EventDescription;
	resource_id_getter: (
		context: Context,
		item: CollectionItem,
		event: EventDescription
	) => Promise<string[]>;
};

type GetValue<T extends Field> = (
	context: Context,
	resource_id: string
) => Promise<Parameters<T["encode"]>[1]>;

type CachedValueSettings<T extends Field> = {
	refresh_on: RefreshCondition[];
	get_value: GetValue<T>;
	initial_value: Parameters<T["encode"]>[1];
};

export default class CachedValue<T extends Field> extends HybridField<T> {
	typeName = "cached-value";

	app: App;
	refresh_on: RefreshCondition[];
	get_value: GetValue<T>;
	hasDefaultValue: () => true;
	private initial_value: Parameters<T["encode"]>[1];

	constructor(base_field: T, params: CachedValueSettings<T>) {
		super(base_field);
		super.setParams(params);
		this.refresh_on = params.refresh_on;
		this.get_value = params.get_value;
		this.initial_value = params.initial_value;
	}

	async init(app: App) {
		await super.init(app);
		await this.virtual_field.init(app);
		this.checkForPossibleRecursiveEdits();

		const create_action = this.refresh_on.find(({ event }) =>
			event.event_name.includes("create")
		);

		if (create_action) {
			app.on("started", () =>
				this.refresh_outdated_cache_values(create_action)
			);
		}

		for (let { event, resource_id_getter } of this.refresh_on) {
			event.attachTo(app, async ([context, item, event]) => {
				const cache_resource_ids = await resource_id_getter(
					context,
					item,
					event
				);

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
				for (const cache_resource_id of cache_resource_ids) {
					promises.push(
						this.get_value(context, cache_resource_id).then(
							async (value) => {
								const item = await context.app.collections[
									this.collection.name
								].suGetByID(cache_resource_id);
								item.set(this.name, value);
								await item.save(new app.SuperContext());
							}
						)
					);
				}
				await Promise.all(promises);
			});
		}
	}

	checkForPossibleRecursiveEdits() {
		const doesAnyMatches = this.refresh_on.some(
			({ event }) => event.collection_name === this.collection.name
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

	private async refresh_outdated_cache_values(condition: RefreshCondition) {
		const referenced_collection_name = condition.event.collection_name;
		const response = await new ItemList(
			this.app.collections[referenced_collection_name],
			new this.app.SuperContext()
		)
			.sort({ "_metadata.modified_at": "desc" })
			.paginate({ items: 1 })
			.fetch();

		if (response.empty) {
			return;
		}

		const last_modified_timestamp = response.items[0]._metadata.modified_at;

		const outdated_resources = await this.app.Datastore.aggregate(
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

		this.app.Logger.debug3("CACHED", "Outdated items", outdated_resources);

		if (!outdated_resources) {
			return;
		}

		const context = new this.app.SuperContext();
		for (let resource of outdated_resources) {
			const value = await this.get_value(context, resource.id);
			const cache_value = await this.encode(context, value);
			this.app.Logger.debug3(
				"CACHED",
				`New value for item ${resource.id}.${this.name}`,
				value
			);
			await this.app.Datastore.update(
				this.collection.name,
				{ id: resource.id },
				{ $set: { [this.name]: cache_value } }
			);
		}
	}

	async getDefaultValue(_: Context) {
		return this.initial_value;
	}

	async encode(context: Context, new_value: any) {
		const encoded_value = await super.encode(context, new_value);
		const ret = { timestamp: Date.now(), value: encoded_value };
		context.app.Logger.debug3("CACHED VALUE", "Encode", { new_value, ret });
		return ret;
	}

	async decode(
		context: Context,
		db_value: { timestamp: number; value: any },
		old_value: any,
		format: any
	) {
		return super.decode(context, db_value.value, old_value, format);
	}

	async isProperValue(
		context: Context,
		new_value: Parameters<T["checkValue"]>[1],
		old_value: Parameters<T["checkValue"]>[2]
	) {
		if (!isEmpty(new_value) && !context.is_super) {
			throw new BadContext("This is a read-only field");
		}
		return this.virtual_field.checkValue(context, new_value, old_value);
	}

	async getValuePath() {
		return `${this.name}.value`;
	}
}
