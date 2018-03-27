"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Query = require("../../../datastore/query.js");

const Super = {
	name: "super",
	getRestrictingQuery: async function(context) {
		if (context.is_super) {
			return new Query.AllowAll();
		}
		return new Query.DenyAll();
	},
	checker_function: function(context) {
		if (context.is_super) {
			return Promise.resolve();
		} else {
			return Promise.reject(
				"This action cannot be performed by a regular user, but only by the server itself."
			);
		}
	},
	item_sensitive: true,
};

module.exports = Super;
