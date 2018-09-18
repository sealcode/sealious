module.exports = app => ({
	name: "user-referenced-in-field",
	getRestrictingQuery: async (context, field_name) => {
		if (!context.user_id) return new app.Query.DenyAll();
		return app.Query.fromSingleMatch({
			[field_name]: context.user_id,
		});
	},
	checker_function: (context, field_name, item) => {
		if (!context.user_id) return Promise.reject("You're not logged in!");
		else if (context.user_id === item[field_name]) return Promise.resolve();
		else return Promise.reject("Access not allowed for this user");
	},
	item_sensitive: true,
});
