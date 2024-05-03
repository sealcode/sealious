// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractTail<T extends any[]> = T extends [infer _, ...infer Tail]
	? Tail
	: never;
