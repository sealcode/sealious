module.exports = app => ({
	name: "disallow-update",
	is_proper_value: (context, params, new_value, old_value) => {
		const target_field_type = new app.Sealious.FieldType(
			app,
			params.target_field.type
		);

		if (old_value === undefined) {
			return target_field_type.is_proper_value(
				new app.Sealious.SuperContext(),
				params.target_field.params,
				new_value,
				old_value
			);
		}

		return Promise.reject("You cannot change previously set value.");
	},
});
