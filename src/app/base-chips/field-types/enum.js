module.exports = {
	name: "enum",
	is_proper_value: async function(context, params, value) {
		const allowed_values =
			params.values instanceof Function
				? await params.values()
				: params.values;
		if (allowed_values.indexOf(value) !== -1) {
			return Promise.resolve();
		} else {
			return Promise.reject("Allowed values: " + allowed_values.join());
		}
	},
};
