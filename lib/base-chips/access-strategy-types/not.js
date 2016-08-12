"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategy = locreq("lib/chip-types/access-strategy.js");
const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");

module.exports = new AccessStrategyType({
	name: "not",
	checker_function: function(context, params, item){
		let strategies;
		if (params instanceof Array){
			strategies = params.map((declaration) => new AccessStrategy(declaration));
		} else {
			strategies = [new AccessStrategy(params)];
		}
		return Promise.map(strategies, function(strategy){
			return strategy.check(context, params, item);
		})
		.any()
		.then(function(){
			return Promise.reject("Action not allowed");
		})
		.catch({sealious_error: true}, function(){
			return Promise.resolve();
		});
	},
});
