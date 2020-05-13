import assert from "assert";

export default async function assertThrowsAsync(
	fn: () => Promise<any>,
	error_handler: (e: any) => Promise<any> | any
) {
	let error = null;
	try {
		await fn();
	} catch (e) {
		error = e;
	} finally {
		assert.notStrictEqual(error, null, "It didn't throw");
		await error_handler(error as any);
	}
}
