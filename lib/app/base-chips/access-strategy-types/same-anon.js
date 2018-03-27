"use strict";
const Query = require("../../../datastore/query.js");

module.exports = {
	name: "same-anon",
	getRestrictingQuery: async function(context, params) {
		if (context.anonymous_user_id) {
			return Query.fromSingleMatch({
				"created_context.anonymous_user_id": context.anonymous_user_id,
			});
		}
		return new Query.AllowAll();
	},
	checker_function: function(context, params, item) {
		if (context.anonymous_user_id === null) {
			return Promise.reject();
		}
		if (
			context.anonymous_user_id === item.created_context.anonymous_user_id
		) {
			return Promise.resolve();
		} else {
			return Promise.reject(
				"Only the user who created this resource can have access to it"
			);
		}
	},
	item_sensitive: true,
};
