const assert = require("assert");

module.exports = app => {
	return {
		name: "value-not-existing-in-collection",
		extends: "value-existing-in-collection",
		is_proper_value: async (context, params, new_value) => {
			assert.equal(typeof params.field, "string");
			assert(
				typeof params.include_forbidden === "boolean" ||
					params.include_forbidden === undefined
			);
			const collection = params.collection;
			assert(collection instanceof app.Sealious.Collection);
			await collection.fields[params.field].is_proper_value(
				context,
				new_value
			);
			if (params.include_forbidden) {
				context = new app.Sealious.SuperContext();
			}
			const matches = (await app.run_action(
				context,
				["collections", collection.name],
				"show",
				{ filter: { [params.field]: new_value } }
			)).items;
			if (matches.length) {
				return Promise.reject(
					`No ${collection.name} with ${
						params.field
					} set to ${new_value}`
				);
			}
		},
	};
};
