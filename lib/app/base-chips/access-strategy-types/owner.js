"use strict";
const Promise = require("bluebird");
const Query = require("../../../datastore/query.js");

module.exports = {
	name: "owner",
	getRestrictingQuery: async function(context, params) {
		if (context.user_id) {
			return Query.fromSingleMatch({
				"_metadata.created_context.user_id": { $eq: context.user_id },
			});
		}
		return new Query.DenyAll();
	},
	checker_function: function(context, params, item) {
		if (
			context.user_id &&
			context.user_id === item._metadata.created_context.user_id
		) {
			return Promise.resolve();
		} else {
			return Promise.reject(
				"Only the owner of this resource can perform this operation on this item."
			);
		}
	},
	item_sensitive: true,
};
