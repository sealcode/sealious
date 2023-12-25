import EventEmitter from "events";
import { v4 as uuid } from "uuid";

export class LongRunningProcess<
	Args extends Array<unknown>,
	ReturnType extends unknown
> extends EventEmitter {
	public status: "ready" | "running" | "done" | "error" = "ready";
	public id = uuid();

	constructor(
		callback: (
			process: LongRunningProcess<Args, ReturnType> | null,
			...rest: Args
		) => Promise<ReturnType>,
		...args: Args
	) {
		super();
		callback(this, ...args);
	}

	info(text: string) {
		this.emit("info", text);
	}
}
