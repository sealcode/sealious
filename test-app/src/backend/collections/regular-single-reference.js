module.exports = App =>
	App.createCollection({
		name: "regular-single-reference",
		fields: [
			{
				name: "user",
				type: "single_reference",
				params: { collection: "users" },
				required: true,
			},
		],
		access_strategy: {
			create: "public",
		},
	});
