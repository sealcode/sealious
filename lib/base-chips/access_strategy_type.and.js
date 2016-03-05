var Sealious = require("sealious");
var Promise = require("bluebird");

function parse_params (params) {
	var access_strategies = [];
	for (var i in params){
		access_strategies.push(new Sealious.AccessStrategy(params[i]));
	}
	return access_strategies;
}

module.exports = new Sealious.AccessStrategyType({
	name: "or",
	item_sensitive: function(params){
		var access_strategies = parse_params(params);
		return Promise.map(access_strategies, function(access_strategy){
			return access_strategy.is_item_sensitive();
		}).reduce((a,b) => a || b);
	},
	checker_function: function(context, params, item){
		return this.is_item_sensitive()
		.then(function(item_sensitive){
			if (item_sensitive && item === undefined){
				return undefined;
			} else {
				var access_strategies = parse_params(params);
				var results = access_strategies.map(function(strategy){
					return strategy.check(context, item);
				});
				return Promise.all(results);
			}
		})
	}
})
