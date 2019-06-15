"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Error = locreq("lib/response/error.js").Error;
const AccessStrategy = locreq("lib/chip-types/access-strategy.js");
const Query = locreq("lib/datastore/query.js");

function parse_params(app, params) {
	return Object.keys(params).map(i => new AccessStrategy(app, params[i]));
}

module.exports = function(app) {
	const or = {
		name: "or",
		getRestrictingQuery: async function(context, params) {
			const access_strategies = parse_params(app, params);
			const queries = await Promise.map(access_strategies, strategy =>
				strategy.getRestrictingQuery(context)
			);
			if (queries.some(query => query instanceof Query.AllowAll)) {
				return new Query.AllowAll();
			}
			return new Query.Or(...queries);
		},
		item_sensitive: function(params) {
			const access_strategies = parse_params(app, params);
			return Promise.map(access_strategies, function(access_strategy) {
				return access_strategy.is_item_sensitive();
			}).reduce((a, b) => a || b);
		},
		checker_function: function(context, params, sealious_response) {
			if (context.is_super) {
				return Promise.resolve();
			}
			return or.item_sensitive(params).then(function(item_sensitive) {
				if (item_sensitive && sealious_response === undefined) {
					return undefined;
				}
				const access_strategies = parse_params(app, params);
				const results = access_strategies.map(function(strategy) {
					return strategy.check(context, sealious_response);
				});
				return Promise.any(results).catch(
					Promise.AggregateError,
					function(aggregated_errors) {
						aggregated_errors.forEach(function(error) {
							if (!(error instanceof Error)) {
								throw error;
							}
						});
						const error_message = aggregated_errors
							.map(aggregated_errors => aggregated_errors.message)
							.reduce((a, b) => `${a} ${b}`);
						return Promise.reject(error_message);
					}
				);
			});
		},
	};

	return or;
};
