import EventEmitter from "events";
import type LongRunningProcessEvents from "../app/collections/long-running-process-events";
import type LongRunningProcesses from "../app/collections/long-running-processes";
import type { CollectionInput, CollectionItem, Context } from "../main";

type LongRunningProcessEvent = {
	type: string;
	message: string;
	timestamp: number;
};

export type LPRState = "running" | "error" | "finished";

export class LongRunningProcess<
	Args extends Array<unknown> = [],
	ReturnType extends unknown = unknown
> extends EventEmitter {
	public status: "ready" | LPRState = "ready";
	protected itemPromise: Promise<CollectionItem<LongRunningProcesses>>;
	protected isFinishedPromise: Promise<ReturnType>;
	protected static registry: Record<string, LongRunningProcess | undefined> =
		{};

	constructor(
		protected context: Context,
		callback: (
			process: LongRunningProcess<Args, ReturnType> | null,
			...rest: Args
		) => Promise<ReturnType>,
		args: Args,
		name: string = "Long running process",
		owner_id: string | null = context.user_id
	) {
		super();
		if (owner_id == null && !context.is_super) {
			throw new Error(
				"While creating a LongRunningProcess, you can do it either in 'super' access control mode, or in 'user' access control mode. If you want the process to only be available with a supercontext, use SuperContext for the LRP constructor. Otherwise use a regular context with a logged in user or provide the owner id as an argument"
			);
		}
		const item_body = {
			started: Date.now(),
			name,
			owner: owner_id,
		} as CollectionInput<LongRunningProcesses>;
		if (owner_id == null) {
			item_body.access_mode = "super";
		} else {
			item_body.access_mode = "user";
		}
		this.itemPromise =
			context.app.collections.long_running_processes.suCreate(item_body);
		this.getID().then((id) => (LongRunningProcess.registry[id] = this));
		const callback_promise = callback(this, ...args);
		this.isFinishedPromise = this.itemPromise
			.then(async () => await callback_promise)
			.then(async () => {
				await this.setState("finished");
				return callback_promise;
			});
	}

	async info(message: string, progress?: number) {
		if (this.status == "finished") {
			throw new Error("cannot send mor info, this LRP is finished");
		}
		const event_body = {
			process: await this.getID(),
			type: "info",
			timestamp: Date.now(),
			message: message,
		} as CollectionInput<LongRunningProcessEvents>;
		if (progress !== undefined) {
			event_body.progress = progress;
		}
		await this.context.app.collections.long_running_process_events.suCreate(
			event_body
		);
		this.emit("info", { message, progress });
	}

	private async setState(state: "finished" | "error") {
		const id = await this.getID();
		delete LongRunningProcess.registry[id];
		const item =
			await this.context.app.collections.long_running_processes.getByID(
				this.context,
				id
			);
		item.set("state", state);
		await item.save(this.context);
		this.status = state;
		this.emit(state);
	}

	async getID() {
		return (await this.itemPromise).id;
	}

	async waitForFinished() {
		await this.isFinishedPromise;
	}

	static async getByID(
		context: Context,
		id: string
	): Promise<{
		emitter: LongRunningProcess | null; // it returns null if the LRP is finished, as there will be nothing more to emit;
		events: LongRunningProcessEvent[];
		latestEvent: LongRunningProcessEvent;
		state: LPRState;
	}> {
		const {
			items: [lrp_item],
		} = await context.app.collections.long_running_processes
			.list(context)
			.ids([id])
			.attach({ events: true })
			.fetch();
		if (!lrp_item) {
			throw new Error("No access or bad ID");
		}
		const events = lrp_item
			.getAttachments("events")
			.map((e) => ({
				type: e.get("type"),
				message: e.get("message"),
				timestamp: e.get("timestamp"),
			}))
			.sort((e1, e2) => (e1.timestamp > e2.timestamp ? 1 : -1));
		return {
			emitter: this.registry[lrp_item.id] || null,
			events,
			latestEvent: events[events.length - 1],
			state: lrp_item.get("state") as LPRState,
		};
	}
}
