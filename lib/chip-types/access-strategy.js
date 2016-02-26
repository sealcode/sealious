var Sealious = require("sealious");

var AccessStrategy = function(access_strategy_type, params){
	this.type = new Sealious.AccessStrategyType(access_strategy_type);
	this.item_sensitive = this.type.item_sensitive;
	this.params = params || {};
}

AccessStrategy.prototype = new function(){

	this.check = function(context, item){
		return this.type.check(context, this.params, item);
	}
}

module.exports = AccessStrategy;
