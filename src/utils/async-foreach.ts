/* eslint-disable @typescript-eslint/no-explicit-any */

// warning - things might get executed out of order
export default async function asyncForEach<T = any>(
	array: T[],
	fn: (obj: T) => Promise<void>
): Promise<void> {
	const promises: Promise<void>[] = [];
	for (const element of array) {
		promises.push(fn(element));
	}
	await Promise.all(promises);
}
