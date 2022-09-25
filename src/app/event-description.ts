import type {
	CollectionEvent,
	CollectionCallback,
} from "../chip-types/collection";
import type { App } from "../main";
import type Context from "../context";
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
		callback: RefreshConditionCallback<CollectionRefreshConditionArgs>
	): void {
		for (const event_name of this.event_names) {
			if (!app.collections[this.collection_name]) {
				throw new Error(
					`Collection '${this.collection_name}' not found, perhaps a typo?`
				);
			}
			app.collections[this.collection_name].on(event_name, callback);
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

	attachTo(app: App, callback: RefreshConditionCallback<[Context]>): void {
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
