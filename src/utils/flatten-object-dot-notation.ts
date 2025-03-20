export default function flattenObjectToDotNotation(
	context: string | null,
	obj: {}
) {
	const prefix = typeof context === "string" ? context + "." : "";
	return flatten(prefix, obj);
}

function flatten(
	prefix: string,
	obj: { [field: string]: { [field: string]: any } }
) {
	return Object.keys(obj).reduce((flattened, prop) => {
		const new_prop = prefix + prop;
		const value = obj[prop];
		if (value && typeof value === "object") {
			Object.assign(
				flattened,
				flattenObjectToDotNotation(new_prop + ".", value)
			);
		} else {
			flattened[new_prop] = value;
		}
		return flattened;
	}, {} as { [field: string]: any });
}
