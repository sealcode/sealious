/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export default function transformObject(
	obj: Record<string, any>,
	prop_tranformer: (prop: string, parent_props: string[]) => string,
	value_transformer: (
		prop: string,
		obj: unknown,
		parent_props: string[]
	) => any,
	parent_props: string[] = []
) {
	// console.log("transformObject", obj);
	const new_obj = Array.isArray(obj) ? [] : ({} as any);
	for (const prop in obj) {
		const new_prop = prop_tranformer(prop, parent_props);
		// if (new_prop !== prop) {
		// console.log(prop, "→", new_prop);
		// }
		new_obj[new_prop] =
			typeof obj[prop] === "object"
				? transformObject(
						obj[prop],
						prop_tranformer,
						value_transformer,
						[new_prop, ...parent_props]
				  )
				: value_transformer(prop, obj[prop], [
						new_prop,
						...parent_props,
				  ]);
		// console.log(obj[prop], "→", new_obj[new_prop]);
	}
	// console.log(obj, "→", new_obj);
	return new_obj;
}
