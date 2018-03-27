"use strict";
const Promise = require("bluebird");
const Query = require("../../../datastore/query.js");

module.exports = {
	name: "noone",
	getRestrictingQuery: async function() {
		return new Query.DenyAll();
	},
	checker_function: function() {
		return Promise.reject("Noone gets in!");
	},
	item_sensitive: false,
};
