/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "assert";

export async function assertThrowsAsync(
	fn: () => Promise<unknown>,
	error_handler?: (e: any) => Promise<void> | void
): Promise<void> {
	let error: unknown = null;
	try {
		await fn();
	} catch (e: unknown) {
		error = e;
	} finally {
		assert.notStrictEqual(error, null, "It didn't throw");
		if (error_handler) {
			await error_handler(error);
		}
	}
}
