"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategy = locreq("lib/chip-types/access-strategy.js");
const Query = locreq("lib/datastore/query.js");

function parse_params(app, params) {
	let strategies;
	if (params instanceof Array) {
		strategies = params.map(
			declaration => new AccessStrategy(app, declaration)
		);
	} else {
		strategies = [new AccessStrategy(app, params)];
	}
	return strategies;
}

module.exports = function(app) {
	return {
		name: "not",
		getRestrictingQuery: async function(context, params) {
			//assuming "not" can take only one access strategy as a parameter
			const strategy = parse_params(app, params)[0];

			const query = await strategy.getRestrictingQuery(context);
			return new Query.Not(query);
		},
		item_sensitive: function(params) {
			const access_strategies = parse_params(app, params);
			return Promise.map(access_strategies, function(access_strategy) {
				return access_strategy.is_item_sensitive();
			}).reduce((a, b) => a || b, false);
		},
		checker_function: function(context, params, sealious_response) {
			const strategies = parse_params(app, params);
			return Promise.map(strategies, function(strategy) {
				return strategy.check(context, sealious_response);
			})
				.any()
				.then(function() {
					return Promise.reject("Action not allowed");
				})
				.catch({ sealious_error: true }, function() {
					return Promise.resolve();
				});
		},
	};
};
