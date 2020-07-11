import { LooseObject } from "../subject/types";

export default function transformObject(
	obj: LooseObject,
	prop_tranformer: (prop: string) => string,
	value_transformer: (prop: string, obj: Object) => any
) {
	return Object.keys(obj).reduce(
		(new_obj, prop) => {
			let new_prop = prop_tranformer(prop);
			new_obj[new_prop] =
				obj[prop] instanceof Object
					? transformObject(
							obj[prop],
							prop_tranformer,
							value_transformer
					  )
					: value_transformer(prop, obj[prop]);

			return new_obj;
		},
		Array.isArray(obj) ? [] : ({} as LooseObject)
	);
}
