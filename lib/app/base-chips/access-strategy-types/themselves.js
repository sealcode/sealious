"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Query = require("../../../datastore/query.js");

module.exports = {
	name: "themselves",
	item_sensitive: true,
	getRestrictingQuery: async function(context, params) {
		return Query.fromSingleMatch({
			sealious_id: { $eq: context.user_id },
		});
	},
	checker_function: function(context, params, item) {
		if (context.user_id === item.id) {
			return Promise.resolve();
		} else {
			return Promise.reject(`You are not the user of id ${item.id}.`);
		}
	},
};
