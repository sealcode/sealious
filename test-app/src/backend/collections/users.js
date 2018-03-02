module.exports = app => {
	const Users = app.ChipManager.get_chip("collection", "users");

	Users.add_fields([
		{
			name: "role",
			type: "enum",
			params: { values: ["admin", "regular", "banned"] },
			required: true,
		},
	]);

	Users.set_access_strategy({
		create: "public",
		retrieve: "public",
	});
};
