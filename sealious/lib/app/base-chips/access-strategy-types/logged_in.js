"use strict";
const Promise = require("bluebird");

const DENY = [{ $match: { _id: { $exists: false } } }];
const ACCEPT = [{ $match: { _id: { $exists: true } } }];

module.exports = {
	name: "logged_in",
	get_pre_aggregation_stage: function(context) {
		if (context.user_id) {
			return Promise.resolve(ACCEPT);
		} else {
			return Promise.resolve(DENY);
		}
	},
	checker_function: function(context) {
		if (context.user_id) {
			return Promise.resolve();
		} else {
			return Promise.reject("Only logged-in users can perform this action.");
		}
	},
};
