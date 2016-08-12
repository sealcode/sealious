"use strict";
const locreq = require("locreq")(__dirname);
const Sealious = require("sealious");
const me_synonyms = locreq("lib/misc/me-synonyms.json");

module.exports = {
	name: "username",
	extends: "text",
	is_proper_value: function(context, params, new_value, old_value){
		if (old_value === new_value){
			return Promise.resolve();
		} else if (me_synonyms.indexOf(new_value) !== -1){
			return Promise.reject(`'${new_value}'' is a reserved keyword. Please pick another username.`);
		} else {
			return Sealious.run_action(new Sealious.SuperContext(context), ["resources", "user"], "show", {filter:{username: new_value}})
			.then(function(results){
				if (results.length === 0){
					return Promise.resolve();
				} else {
					return Promise.reject("Username already taken");
				}
			});
		}
	},
};
