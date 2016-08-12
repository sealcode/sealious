"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");

module.exports = new AccessStrategyType({
	name: "themselves",
	item_sensitive: true,
	checker_function: function(context, params, item){
		if (context.user_id === item.id){
			return Promise.resolve();
		} else {
			return Promise.reject(`You are not the user of id ${item.id}.`);
		}
	},
});
