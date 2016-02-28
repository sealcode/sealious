var Sealious = require("sealious");
var Promise = require("bluebird");

function parse_params (params) {
	var access_strategy_types = [];
	for (var i in params){
		access_strategy_types.push(new Sealious.AccessStrategyType(params[i]));
	}
	return access_strategy_types;
}

module.exports = new Sealious.AccessStrategyType({
	name: "and",
	item_sensitive: function(params){
		var access_strategy_types = parse_params(params);
		return Promise.map(access_strategy_types, function(access_strategy_type){
			return access_strategy_type.is_item_sensitive();
		}).reduce((a,b) => a && b);
	},
	checker_function: function(context, params, item){
		var access_strategy_types = parse_params(params);
		return Promise.map(access_strategy_types, function(access_strategy_type){
			return access_strategy_type.check(context, {}, item);
		}).all();
	}
})
