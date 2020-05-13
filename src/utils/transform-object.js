function transformObject(obj, prop_tranformer, value_transformer) {
	return Object.keys(obj).reduce((new_obj, prop) => {
		let new_prop = prop_tranformer(prop);
		new_obj[new_prop] =
			obj[prop] instanceof Object
				? transformObject(obj[prop], prop_tranformer, value_transformer)
				: value_transformer(prop, obj[prop]);

		return new_obj;
	}, Array.isArray(obj) ? [] : {});
}

module.exports = transformObject;
