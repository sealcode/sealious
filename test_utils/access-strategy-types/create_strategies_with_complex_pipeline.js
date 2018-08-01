const Promise = require("bluebird");

module.exports = {
	allow_deny: function(App) {
		const access_strategies = [
			"complex-deny-pipeline",
			"complex-allow-pipeline",
		];

		for (const strategy of access_strategies) {
			App.createChip(Sealious.AccessStrategyType, {
				name: strategy,
				getRestrictingQuery: async function() {
					const query = new App.Query();
					const id = query.lookup({
						from: "numbers",
						localField: "body.number",
						foreignField: "sealious_id",
					});
					query.match({
						[`${id}._id`]: {
							$exists: strategy === "complex-allow-pipeline",
						},
					});
					return query;
				},
				checker_function: function() {
					return Promise.resolve();
				},
				item_sensitive: true,
			});
		}
	},
};
