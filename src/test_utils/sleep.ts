import { promisify } from "util";

export const sleep = promisify((time: number, cb: () => void) =>
	setTimeout(cb, time)
);
