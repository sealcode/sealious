"use strict";
const Promise = require("bluebird");
const Query = require("../../../datastore/query.js");

module.exports = {
	name: "logged_in",
	getRestrictingQuery: async function(context) {
		if (context.user_id) {
			return new Query.AllowAll();
		}
		return new Query.DenyAll();
	},
	checker_function: function(context) {
		if (context.user_id) {
			return Promise.resolve();
		} else {
			return Promise.reject(
				"Only logged-in users can perform this action."
			);
		}
	},
};
