module.exports = app => ({
	name: "user-referenced-in-field",
	getRestrictingQuery: async (context, field_name) => {
		if (!context.user_id) return new app.Query.DenyAll();
		return app.Query.fromSingleMatch({
			[field_name]: context.user_id,
		});
	},
	checker_function: async (context, field_name, sealious_response) => {
		if (!context.user_id) return Promise.reject("You're not logged in!");
		if (context.user_id !== sealious_response[field_name])
			return Promise.reject("Access not allowed for this user");
	},
	item_sensitive: true,
});
