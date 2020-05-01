const me_synonyms = require("../../../misc/me-synonyms.json");
const SuperContext = require("../../../super-context.js");

module.exports = function (app) {
	return {
		name: "username",
		extends: "text",
		is_proper_value: async function (
			context,
			params,
			new_value,
			old_value
		) {
			if (old_value === new_value) {
				return;
			}
			if (me_synonyms.indexOf(new_value) !== -1) {
				throw new Error(
					`'${new_value}'' is a reserved keyword. Please pick another username.`
				);
			}
			return app
				.run_action(
					new SuperContext(context),
					["collections", "users"],
					"show",
					{ filter: { username: new_value } }
				)
				.then(function (response) {
					if (!response.empty) {
						throw new Error("Username already taken");
					}
				});
		},
	};
};
