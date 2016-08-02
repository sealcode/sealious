const Sealious = require("sealious");
const Promise = require("bluebird");

module.exports = new Sealious.AccessStrategyType({
	name: "not",
	checker_function: function(context, params, item){
		let strategies;
		if (params instanceof Array){
			strategies = params.map((declaration) => new Sealious.AccessStrategy(declaration));
		} else {
			strategies = [new Sealious.AccessStrategy(params)];
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
