module.exports = App =>
	App.createCollection({
		name: "filter-single-reference",
		fields: [
			{
				name: "user",
				type: "single_reference",
				params: {
					collection: "users",
					filter: {
						role: "admin",
					},
				},
				required: true,
			},
		],
		access_strategy: {
			default: "public",
		},
	});
