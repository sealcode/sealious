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
		if (obj[prop] && typeof obj[prop] === "object") {
			Object.assign(
				flattened,
				flattenObjectToDotNotation(new_prop + ".", obj[prop])
			);
		} else {
			flattened[new_prop] = obj[prop];
		}
		return flattened;
	}, {} as { [field: string]: any });
}
