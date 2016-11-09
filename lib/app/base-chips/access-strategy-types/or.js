"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategy = locreq("lib/chip-types/access-strategy.js");
const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");
const Error = locreq("lib/response/error.js").Error;

function parse_params (app, params){
	const access_strategies = [];
	for (const i in params){
		access_strategies.push(new AccessStrategy(app, params[i]));
	}
	return access_strategies;
}

module.exports = function(app){
	const or = {
		name: "or",
		item_sensitive: function(params){
			const access_strategies = parse_params(app, params);
			return Promise.map(access_strategies, function(access_strategy){
				return access_strategy.is_item_sensitive();
			})
			.reduce((a,b) => a || b);
		},
		checker_function: function(context, params, item){
			return or.item_sensitive(params)
			.then(function(item_sensitive){
				if (item_sensitive && item === undefined){
					return undefined;
				} else {
					const access_strategies = parse_params(app, params);
					const results = access_strategies.map(function(strategy){
						return strategy.check(context, item);
					});
					return Promise.any(results)
					.catch(Promise.AggregateError, function(aggregated_errors){
						aggregated_errors.forEach(function(error){
							if (!(error instanceof Error)){
								throw error;
							}
						});
						const error_message = aggregated_errors.map((aggregated_errors)=>aggregated_errors.message)
						.reduce((a,b) => `${a} ${b}`);
						return Promise.reject(error_message);
					});
				}
			});
		},
	};

	return or;

};
