var Sealious = require("sealious");

var AccessStrategy = function(declaration){
	if (declaration instanceof Array){
		this.type = new Sealious.AccessStrategyType(declaration[0]);
		this.params = declaration[1] || {};
	} else if (typeof declaration === "string" || declaration instanceof Sealious.AccessStrategyType){
		this.type = new Sealious.AccessStrategyType(declaration);
		this.params = {};
	} else {
		this.type = new Sealious.AccessStrategyType(declaration.type);
		this.params = declaration.params || {};
	}
	this.item_sensitive = this.type.item_sensitive;
}

AccessStrategy.prototype = new function(){

	this.check = function(context, item){
		return this.type.check(context, this.params, item);
	}
}

module.exports = AccessStrategy;
