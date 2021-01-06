export default function transformObject<T>(
	obj: T,
	prop_tranformer: (prop: string) => keyof T,
	value_transformer: (prop: string, obj: Object) => any
) {
	const new_obj = Array.isArray(obj) ? (([] as unknown) as T) : ({} as T);
	for (const prop in obj) {
		let new_prop = prop_tranformer(prop);
		new_obj[new_prop] =
			typeof obj[prop] === "object"
				? transformObject(
						(obj[prop] as unknown) as T,
						prop_tranformer,
						value_transformer
				  )
				: value_transformer(prop, obj[prop]);
	}
	return new_obj;
}
