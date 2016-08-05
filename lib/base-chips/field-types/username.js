"use strict";
const locreq = require("locreq")(__dirname);
const me_synonyms = locreq("lib/misc/me-synonyms.json");
const SuperContext = locreq("lib/super-context.js");
const run_action = locreq("lib/utils/run-action.js");

module.exports = {
	name: "username",
	extends: "text",
	is_proper_value: function(accept, reject, context, params, new_value, old_value){
		if (old_value === new_value){
			accept();
		} else if (me_synonyms.indexOf(new_value) !== -1){
			reject(`'${new_value}'' is a reserved keyword. Please pick another username.`);
		} else {
			run_action(new SuperContext(context), ["resources", "user"], "show", {filter:{username: new_value}})
			.then(function(results){
				if (results.length === 0){
					accept();
				} else {
					reject("Username already taken");
				}
			});
		}
	},
};
