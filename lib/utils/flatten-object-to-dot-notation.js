module.exports = function(context, obj) {
	const prefix = typeof context === "string" ? context + "." : "";
	return flattenObjectToDotNotation(prefix, obj);
};

function flattenObjectToDotNotation(prefix, obj) {
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
	}, {});
}
