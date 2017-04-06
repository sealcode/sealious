"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategy = locreq("lib/chip-types/access-strategy.js");

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
        get_pre_aggregation_stage: function(context, params) {
            //assuming "not" can take only one access strategy as a parameter
            const strategy = parse_params(app, params)[0];
            return strategy
                .get_pre_aggregation_stage(context)
                .filter(
                    stage =>
                        Object.keys(stage).length === 1 &&
                        Object.keys(stage)[0] === "$match"
                )
                .map(function(stage) {
                    const ret = { $match: {} };
                    for (let field_name in stage.$match) {
                        ret.$match[field_name] = {
                            $not: stage.$match[field_name],
                        };
                    }
                    return ret;
                });
        },
        item_sensitive: function(params) {
            const access_strategies = parse_params(app, params);
            return Promise.map(access_strategies, function(access_strategy) {
                return access_strategy.is_item_sensitive();
            }).reduce((a, b) => a || b, false);
        },
        checker_function: function(context, params, item) {
            const strategies = parse_params(app, params);
            return Promise.map(strategies, function(strategy) {
                return strategy.check(context, params, item);
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
