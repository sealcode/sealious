"use strict";
const Promise = require("bluebird");
const Query = require("../../../datastore/query.js");

module.exports = {
	name: "public",

	getRestrictingQuery: async function() {
		return new Query.AllowAll();
	},
	checker_function: function() {
		return Promise.resolve("Everybody is a winner!");
	},
	item_sensitive: false,
};
