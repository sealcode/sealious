import {
	App,
	Field,
	Context,
	Collection,
	EventDescription,
	EventMatchers,
	SuperContext,
} from "../../../main";
import { FieldDefinition } from "../../../chip-types/field";
import { EventMatcher } from "../../event-matchers";

type ExtractParams<F> = F extends Field<infer T, any> ? T : never;
type ExtractInputType<F> = F extends Field<any, infer T> ? T : never;
type ExtractOutputType<F> = F extends Field<any, any, infer T> ? T : never;
type ExtractStorageType<F> = F extends Field<any, any, any, infer T>
	? T
	: never;
type ExtractFormatParams<F> = F extends Field<any, any, any, any, infer T>
	? T
	: never;

type RefreshCondition = {
	event_matcher: EventMatcher;
	resource_id_getter: (
		emitted_event: EventDescription,
		response: any
	) => Promise<string>;
};

type GetValue<T> = (
	context: Context,
	resource_id: string
) => Promise<ExtractInputType<T>>;

export default class CachedValue<T extends Field> extends Field<
	{
		base_field_type: { new (d: FieldDefinition): T };
		base_field_params: ExtractParams<T>;
		refresh_on: RefreshCondition[];
		get_value: GetValue<T>;
	},
	ExtractInputType<T>,
	ExtractOutputType<T>,
	ExtractStorageType<T>,
	ExtractFormatParams<T>
> {
	getTypeName = () => "cached-value";

	value_path_after_field_name: ".value";

	virtual_field: T;
	refresh_on: RefreshCondition[];
	get_value: GetValue<T>;

	app: App;

	constructor(definition: FieldDefinition, collection: Collection) {
		super(definition, collection);
		this.virtual_field = new this.params.base_field_type({
			name: this.name,
			required: false,
			type: this.params.base_field_type.name,
			params: this.params,
		});
		this.refresh_on = this.params.refresh_on;
		this.get_value = this.params.get_value;
	}

	async init(app: App) {
		this.app = app;
		this.checkForPossibleRecursiveEdits();

		const create_action = this.refresh_on.find(({ event_matcher }) =>
			event_matcher.containsAction("create")
		);

		if (create_action) {
			app.on("start", () =>
				this._refresh_outdated_cache_values(create_action)
			);
		}

		for (let { event_matcher, resource_id_getter } of this.refresh_on) {
			app.addHook(event_matcher, async (emitted_event, resource) => {
				const cache_resource_id = await resource_id_getter(
					emitted_event,
					resource
				);

				await app.run_action(
					new app.Sealious.SuperContext(
						emitted_event.metadata.context
					),
					["collections", this.collection.name, cache_resource_id],
					"edit",
					{
						[this.name]: await this.get_value(
							emitted_event.metadata.context,
							cache_resource_id
						),
					}
				);
			});
		}
	}

	checkForPossibleRecursiveEdits() {
		const doesAnyMatches = this.refresh_on.some(({ event_matcher }) => {
			if (
				event_matcher instanceof EventMatchers.Collection ||
				event_matcher instanceof EventMatchers.Resource
			) {
				return event_matcher.collection_name === this.collection.name;
			}
			return event_matcher.subject_path.test(
				`collections.${this.collection.name}`
			);
		});
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

	async _refresh_outdated_cache_values(create_action: RefreshCondition) {
		const referenced_collection_name =
			create_action.event_matcher.collection_name;
		if (!referenced_collection_name) {
			this.app.Logger.debug(
				"Not refreshing outdated values, unknown collection for: " +
					JSON.stringify(create_action)
			);
			return;
		}

		const response = await this.app.run_action(
			new SuperContext(),
			["collections", referenced_collection_name],
			"show",
			{
				sort: { "_metadata.last_modified_context.timestamp": "desc" },
				pagination: { items: 1 },
			}
		);

		if (response.empty) {
			return;
		}

		const last_modified_timestamp =
			response.items[0]._metadata.last_modified_context.timestamp;

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

		if (!outdated_resources) {
			return;
		}

		const context = new SuperContext();
		for (let resource of outdated_resources) {
			const cache_value = await this.encode(
				context,
				await this.get_value(context, resource.sealious_id)
			);
			await this.app.Datastore.update(
				this.collection.name,
				{ sealious_id: resource.sealious_id },
				{ $set: { [this.name]: cache_value } }
			);
		}
	}

	async encode(
		context: Context,
		value: ExtractInputType<T>,
		old_value?: ExtractInputType<T>
	) {
		return this.virtual_field.encode(context, value, old_value);
	}

	async filterToQuery(context: Context, filter: any) {
		return this.virtual_field.filterToQuery(context, filter);
	}

	async isProperValue(
		context: Context,
		new_value: ExtractInputType<T>,
		old_value: ExtractInputType<T>
	) {
		if (!context.is_super) {
			return Promise.reject("This is a read-only field");
		}
		return this.virtual_field.isProperValue(context, new_value, old_value);
	}
}
