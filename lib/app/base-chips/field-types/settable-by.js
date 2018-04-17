module.exports = app => ({
	name: "settable-by",
	encode: function(context, params, new_value, old_value) {
		return params.target_field_type.encode(
			context,
			params,
			new_value,
			old_value
		);
	},
	is_proper_value: async function(
		context,
		{ target_field_type, target_params = {}, access_strategy_description },
		new_value,
		old_value
	) {
		const access_strategy = new app.Sealious.AccessStrategy(
			app,
			access_strategy_description
		);
		await access_strategy.check(context);
		return target_field_type.is_proper_value(
			context,
			target_params,
			new_value,
			old_value
		);
	},
	format: function(
		context,
		{ target_field_type, target_params },
		decode_value,
		format
	) {
		return target_field_type.format(
			context,
			target_params,
			decode_value,
			format
		);
	},
	filter_to_query: function(
		context,
		{ target_field_type, target_params },
		filter
	) {
		return target_field_type.filter_to_query(
			context,
			target_params,
			filter
		);
	},
	get_aggregation_stages: function(
		context,
		{ target_field_type, target_params },
		field_name,
		query_params
	) {
		return target_field_type.get_aggregation_stages(
			context,
			target_params,
			field_name,
			query_params
		);
	},
	has_index: function({ target_field_type, target_params }) {
		return target_field_type.has_index(target_params);
	},
});
