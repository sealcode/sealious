import EventEmitter from "events";

import type LongRunningProcessEvents from "../app/collections/long-running-process-events.js";
import type LongRunningProcesses from "../app/collections/long-running-processes.js";
import type { CollectionInput, CollectionItem, Context } from "../main.js";

type LongRunningProcessEvent = {
	type: string;
	message: string;
	timestamp: number;
};

export type LPRState = "running" | "error" | "finished";

export class LongRunningProcess<
	Args extends Array<unknown> = []
> extends EventEmitter {
	public status: "ready" | LPRState = "ready";
	protected itemPromise: Promise<CollectionItem<LongRunningProcesses>>;
	protected isFinishedPromise: Promise<void>;
	protected static registry: Record<string, LongRunningProcess | undefined> =
		{};

	constructor(
		protected context: Context,
		callback: (
			process: LongRunningProcess<Args> | null,
			...rest: Args
		) => Promise<unknown>,
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
		this.isFinishedPromise = callback(this, ...args)
			.then(() => this.setState("finished"))
			.catch((error) => {
				this.context.app.Logger.error(
					"LRP",
					error.message.split("\n")[0],
					error
				);
				return this.error(error.message);
			});
	}

	async error(message: string) {
		await this.setState("error");
		await this.addEvent(message, "error");
	}

	async addEvent(message: string, type: "info" | "error", progress?: number) {
		const event_body = {
			process: await this.getID(),
			type,
			timestamp: Date.now(),
			message: message,
		} as CollectionInput<LongRunningProcessEvents>;
		if (progress !== undefined) {
			event_body.progress = progress;
		}
		await this.context.app.collections.long_running_process_events.suCreate(
			event_body
		);
	}

	emit(...args: Parameters<EventEmitter["emit"]>) {
		if (args[0] === "error") {
			args[0] = "_error"; // otherwise Emitter screams;
		}
		return super.emit(...args);
	}

	async info(message: string, progress?: number) {
		if (this.status == "finished") {
			throw new Error("cannot send more info, this LRP is finished");
		}
		await this.addEvent(message, "info", progress);
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
		progress: number;
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
			.map((e: CollectionItem<LongRunningProcessEvents>) => ({
				type: e.get("type"),
				message: e.get("message"),
				timestamp: e.get("timestamp") as number,
				progress: e.get("progress"),
			}))
			.sort(({ timestamp: t1 }, { timestamp: t2 }) =>
				!t1 || !t2 ? 0 : t1 > t2 ? 1 : -1
			);
		const latestEvent = events[events.length - 1];
		return {
			emitter: this.registry[lrp_item.id] || null,
			events,
			latestEvent,
			state: lrp_item.get("state") as LPRState,
			progress: latestEvent?.progress || 0,
		};
	}
}
