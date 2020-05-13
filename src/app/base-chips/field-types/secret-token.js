const uuid = require("node-uuid").v4;

module.exports = {
	name: "secret-token",
	get_default_value: async () => "anything",
	is_old_value_sensitive: true,
	is_proper_value: (context, params, value) => Promise.resolve(),
	encode: (context, params, value, old_value) =>
		old_value ? old_value : uuid(),
	decode: (context, params, value) =>
		context.is_super ? value : "it's a secret to everybody",
	filter_to_query: (context, params, field_filter) => {
		if (context.is_super) {
			return { $eq: field_filter };
		} else {
			return { $eq: "nice try" };
		}
	},
};
