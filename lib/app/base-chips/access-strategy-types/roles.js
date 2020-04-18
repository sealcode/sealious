const get_matching_roles_counter = async function (
	app,
	context,
	allowed_roles
) {
	const user_id = context.user_id;

	const user_roles = (
		await app.run_action(
			new app.Sealious.SuperContext(context),
			["collections", "user-roles"],
			"show",
			{ filter: { user: user_id } }
		)
	).items.map((role_resource) => role_resource.role);

	return allowed_roles.filter((allowed_role) =>
		user_roles.includes(allowed_role)
	).length;
};

module.exports = (app) => ({
	name: "roles",
	getRestrictingQuery: async (context, params) => {
		if (context.user_id === null) {
			return new app.Query.DenyAll();
		}

		const matching_roles_counter = await get_matching_roles_counter(
			app,
			context,
			params
		);

		return matching_roles_counter > 0
			? new app.Query.AllowAll()
			: new app.Query.DenyAll();
	},
	checker_function: async (context, params) => {
		if (context.user_id === null) {
			return Promise.reject("You're not logged in!");
		}

		const allowed_roles = params;
		const matching_roles_counter = await get_matching_roles_counter(
			app,
			context,
			allowed_roles
		);

		return matching_roles_counter > 0
			? Promise.resolve()
			: Promise.reject(
					`Action allowed only for users with role ${allowed_roles.join(
						", "
					)}.`
			  );
	},
});
