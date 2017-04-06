"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategy = locreq("lib/chip-types/access-strategy.js");
const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");
const Error = locreq("lib/response/error.js").Error;

function parse_params(app, params) {
    const access_strategies = [];
    for (const i in params) {
        access_strategies.push(new AccessStrategy(app, params[i]));
    }
    return access_strategies;
}

module.exports = function(app) {
    const or = {
        name: "or",
        get_pre_aggregation_stage: function(context, params) {
            const facet_stages = {};
            const total_pipelines = 0;

            const access_strategies = parse_params(app, params);
            return Promise.map(access_strategies, function(strategy) {
                return strategy.get_pre_aggregation_stage(context);
            })
                .map(function(a) {
                    if (a.length === 1) return a;
                    else return [{ $match: { _id: { $exists: true } } }]; // cannot merge in a trivial way. Add an always positive match so resources that could be accepted by this access strategy aren't excluded
                })
                .filter(a => a.length === 1)
                .filter(a => Object.keys(a[0])[0] === "$match")
                .map(a => a[0].$match)
                .then(alternatives => {
                    if (alternatives.length) {
                        return [{ $match: { $or: alternatives } }];
                    } else {
                        return [];
                    }
                });
        },
        item_sensitive: function(params) {
            const access_strategies = parse_params(app, params);
            return Promise.map(access_strategies, function(access_strategy) {
                return access_strategy.is_item_sensitive();
            }).reduce((a, b) => a || b);
        },
        checker_function: function(context, params, item) {
            return or.item_sensitive(params).then(function(item_sensitive) {
                if (item_sensitive && item === undefined) {
                    return undefined;
                } else {
                    const access_strategies = parse_params(app, params);
                    const results = access_strategies.map(function(strategy) {
                        return strategy.check(context, item);
                    });
                    return Promise.any(
                        results
                    ).catch(
                        Promise.AggregateError,
                        function(aggregated_errors) {
                            aggregated_errors.forEach(function(error) {
                                if (!(error instanceof Error)) {
                                    throw error;
                                }
                            });
                            const error_message = aggregated_errors
                                .map(
                                    aggregated_errors =>
                                        aggregated_errors.message
                                )
                                .reduce((a, b) => `${a} ${b}`);
                            return Promise.reject(error_message);
                        }
                    );
                }
            });
        },
    };

    return or;
};
