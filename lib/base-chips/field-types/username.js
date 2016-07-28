const Sealious = require("sealious");
const me_synonyms = require.main.require("lib/misc/me-synonyms.json");

module.exports = {
	name: "username",
	extends: "text",
	is_proper_value: function(accept, reject, context, params, new_value, old_value){
		if (old_value === new_value){
			accept();
		} else if (me_synonyms.indexOf(new_value) !== -1){
			reject(`'${new_value}'' is a reserved keyword. Please pick another username.`);
		} else {
			Sealious.run_action(new Sealious.SuperContext(context), ["resources", "user"], "show", {filter:{username: new_value}})
			.then(function(results){
				if (results.length === 0){
					accept();
				} else {
					reject("Username already taken");
				}
			});
		}
	}
};
