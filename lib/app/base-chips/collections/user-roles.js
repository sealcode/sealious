module.exports = app => {
	app.on("start", () => {
		const roles = app.ChipManager.get_chip("collection", "user-roles");
		for (let action of ["create", "delete"]) {
			const access_strategy = roles.get_access_strategy(action);
			if (access_strategy.type.name == "public") {
				app.Logger.warning(
					`'user-roles' collection is using 'public' access strategy for ${action} action. Anyone can change anyone else's role. This is the default behavior and you should overwrite it with 'set_access_strategy'`
				);
			}
		}
	});

	return {
		name: "user-roles",
		fields: [
			{
				name: "role",
				type: "enum",
				params: { values: () => app.ConfigManager.get("roles") },
				required: true,
			},
			{
				name: "user",
				type: "single_reference",
				params: { collection: "users" },
				required: true,
			},
		],
		access_strategy: {
			create: "public",
			delete: "public",
			retrieve: ["user-referenced-in-field", "user"],
			edit: "noone",
		},
	};
};
