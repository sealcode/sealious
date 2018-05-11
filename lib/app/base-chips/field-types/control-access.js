module.exports = app => ({
	name: "control-access",
	is_proper_value: async function(
		context,
		{ target_field_type_name, target_params, target_access_strategies },
		new_value,
		old_value
	) {
		const target_field_type = app.FieldType(target_field_type_name);

		const target_access_strategy = new app.Sealious.AccessStrategy(
			app,
			target_access_strategies.update
		);

		if (!context.is_super) {
			try {
				await target_access_strategy.check(context);
			} catch (e) {
				if (e.type === "permission")
					return Promise.reject(
						"You are not allowed to update this field."
					);
			}
		}

		return target_field_type.is_proper_value(
			context,
			target_params,
			new_value,
			old_value
		);
	},
	decode: function(
		context,
		{ target_field_type_name, target_params, target_access_strategies },
		value_in_db
	) {
		const target_access_strategy = new app.Sealious.AccessStrategy(
			app,
			target_access_strategies.retrieve
		);

		const check_access = context.is_super
			? Promise.resolve(value_in_db)
			: target_access_strategy
					.check(context)
					.then(() => value_in_db)
					.catch(err => {
						app.Logger.error(err);
						return "";
					});

		const target_field_type = app.FieldType(target_field_type_name);

		return check_access.then(masked_value =>
			target_field_type.decode(context, target_params, masked_value)
		);
	},
});
