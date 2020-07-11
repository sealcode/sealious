import {
	App,
	Field,
	Context,
	EventDescription,
	EventMatchers,
} from "../../../main";
import { EventMatcher } from "../../event-matchers";
import HybridField, {
	HybridFieldParams,
} from "../../../chip-types/field-hybrid";

type RefreshCondition = {
	event_matcher: EventMatcher;
	resource_id_getter: (
		emitted_event: EventDescription,
		response: any
	) => Promise<string>;
};

type GetValue<T extends Field> = (
	context: Context,
	resource_id: string
) => Promise<Parameters<T["encode"]>[1]>;

export default class CachedValue<T extends Field> extends HybridField<T> {
	getTypeName = () => "cached-value";

	value_path_after_field_name: ".value";

	app: App;
	refresh_on: RefreshCondition[];
	get_value: GetValue<T>;

	setParams(
		params: HybridFieldParams<T> & {
			refresh_on: RefreshCondition[];
			get_value: GetValue<T>;
		}
	) {
		if (this.app.status !== "stopped") {
			throw new Error(
				"cannot add this field to a running app. Add it before runing app.start()"
			);
		}
		super.setParams(params);
		this.refresh_on = params.refresh_on;
		this.get_value = params.get_value;
	}

	async init(app: App) {
		this.app = app;
		this.checkForPossibleRecursiveEdits();

		const create_action = this.refresh_on.find(({ event_matcher }) =>
			event_matcher.containsAction("create")
		);

		if (create_action) {
			app.on("started", () =>
				this.refresh_outdated_cache_values(create_action)
			);
		}

		for (let { event_matcher, resource_id_getter } of this.refresh_on) {
			app.addHook(event_matcher, async (emitted_event, resource) => {
				const cache_resource_id = await resource_id_getter(
					emitted_event,
					resource
				);

				await app.runAction(
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

	private async refresh_outdated_cache_values(
		create_action: RefreshCondition
	) {
		const referenced_collection_name =
			create_action.event_matcher.collection_name;
		if (!referenced_collection_name) {
			this.app.Logger.debug(
				"Not refreshing outdated values, unknown collection for: " +
					JSON.stringify(create_action)
			);
			return;
		}

		const response = await this.app.runAction(
			new this.app.SuperContext(),
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

		const context = new this.app.SuperContext();
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

	async isProperValue(
		context: Context,
		new_value: Parameters<T["isProperValue"]>[1],
		old_value: Parameters<T["isProperValue"]>[2]
	) {
		if (!context.is_super) {
			return Promise.reject("This is a read-only field");
		}
		return this.virtual_field.isProperValue(context, new_value, old_value);
	}
}
