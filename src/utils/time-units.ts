export type TimeUnit = "h" | "m" | "s" | "ms";

const formats: { [unit in TimeUnit]: number } = {
	h: 3600000,
	m: 60000,
	s: 1000,
	ms: 1,
};

export default function time_units(
	from: TimeUnit,
	to: TimeUnit,
	amount: number
): string {
	if (!formats[from] || !formats[to]) {
		throw new Error("Please provide a valid time format");
	}
	if (!amount || typeof amount.valueOf() !== "number") {
		throw new Error("Please provide a valid amount to convert");
	}

	return (formats[from] / formats[to]).toPrecision(8);
}
