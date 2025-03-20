import type {
	CollectionEvent,
	CollectionCallback,
} from "../chip-types/collection.js";
import type { App, Collection } from "../main.js";
import type Context from "../context.js";
import * as cron from "cron";

export type RefreshCallbackArguments = [context: Context, ...args: unknown[]];

export type ResourceIDGetter<
	A extends RefreshCallbackArguments = RefreshCallbackArguments
> = (arg: A) => Promise<string[]>;

export type RefreshConditionCallback<
	A extends RefreshCallbackArguments = RefreshCallbackArguments
> = (arg: A) => Promise<void>;

export abstract class RefreshCondition<
	CallbackArguments extends RefreshCallbackArguments = RefreshCallbackArguments
> {
	constructor(
		public resource_id_getter: ResourceIDGetter<CallbackArguments>
	) {}

	abstract attachTo(
		app: App,
		collection: Collection, // refresh conditions are always used in some kind of automatically refreshing field types. This stores the collection to which that refreshing field belongs to
		callback: RefreshConditionCallback<CallbackArguments>
	): void;
}

export type CollectionRefreshConditionArgs = Parameters<CollectionCallback>[0];

export class CollectionRefreshCondition extends RefreshCondition<CollectionRefreshConditionArgs> {
	public event_names: CollectionEvent[];
	constructor(
		public collection_name: string,
		event_name: CollectionEvent | CollectionEvent[],
		public resource_id_getter: ResourceIDGetter<CollectionRefreshConditionArgs>
	) {
		super(resource_id_getter);
		if (!Array.isArray(event_name)) {
			event_name = [event_name];
		}
		this.event_names = event_name;
	}

	attachTo(
		app: App,
		_: unknown,
		callback: RefreshConditionCallback<CollectionRefreshConditionArgs>
	): void {
		for (const event_name of this.event_names) {
			if (!app.collections[this.collection_name]) {
				throw new Error(
					`Collection '${this.collection_name}' not found, perhaps a typo?`
				);
			}
			app.collections[this.collection_name]!.on(event_name, callback);
		}
	}
}

export class ClockEventDescription extends RefreshCondition<[Context]> {
	constructor(
		public cron_description: string,
		public resource_id_getter: ResourceIDGetter<[Context]>,
		public make_context: (app: App) => Context
	) {
		super(resource_id_getter);
	}

	attachTo(
		app: App,
		_: Collection,
		callback: RefreshConditionCallback<[Context]>
	): void {
		const job = new cron.CronJob(
			this.cron_description,
			() => {
				app.Logger.debug("CRON", "TICK" + this.cron_description);
				void callback([this.make_context(app)]);
			},
			null,
			true
		);
		app.on("stopping", () => {
			job.stop();
		});
	}
}
