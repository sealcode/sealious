"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategy = locreq("lib/chip-types/access-strategy.js");
const Query = require("../../../datastore/query.js");

function parse_params(app, params) {
	return Object.keys(params).map(i => new AccessStrategy(app, params[i]));
}

module.exports = function(app) {
	const and = {
		name: "and",
		getRestrictingQuery: async function(context, params) {
			const access_strategies = parse_params(app, params);
			const queries = await Promise.map(access_strategies, strategy =>
				strategy.getRestrictingQuery(context)
			);
			return new Query.And(...queries);
		},
		item_sensitive: function(params) {
			const access_strategies = parse_params(app, params);
			return Promise.map(access_strategies, function(access_strategy) {
				return access_strategy.is_item_sensitive();
			}).reduce((a, b) => a || b);
		},
		checker_function: function(context, params, sealious_response) {
			return and.item_sensitive(params).then(function(item_sensitive) {
				if (item_sensitive && sealious_response === undefined) {
					return undefined;
				} else {
					const access_strategies = parse_params(app, params);
					const results = access_strategies.map(function(strategy) {
						return strategy.check(context, sealious_response);
					});
					return Promise.all(results);
				}
			});
		},
	};

	return and;
};
