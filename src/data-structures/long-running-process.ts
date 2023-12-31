import EventEmitter from "events";
import type LongRunningProcessEvents from "../app/collections/long-running-process-events";
import type LongRunningProcesses from "../app/collections/long-running-processes";
import type { CollectionInput, CollectionItem, Context } from "../main";

type LongRunningProcessEvent = {
	type: string;
	message: string;
	timestamp: number;
};

export class LongRunningProcess<
	Args extends Array<unknown> = [],
	ReturnType extends unknown = unknown
> extends EventEmitter {
	public status: "ready" | "running" | "finished" | "error" = "ready";
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
		name: string = "Long running process"
	) {
		super();
		this.itemPromise =
			context.app.collections.long_running_processes.suCreate({
				started: Date.now(),
				name,
				owner: context.user_id,
			});
		this.getID().then((id) => (LongRunningProcess.registry[id] = this));
		this.isFinishedPromise = callback(this, ...args);
		this.itemPromise
			.then(() => this.isFinishedPromise)
			.then(() => {
				this.setState("finished");
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

	async setState(state: "finished" | "error") {
		this.getID().then(async (id) => {
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
		});
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
	}> {
		const {
			items: [lrp_item],
		} = await context.app.collections.long_running_processes
			.suList()
			.ids([id])
			.attach({ events: true })
			.fetch();
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
		};
	}
}
