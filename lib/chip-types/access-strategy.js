var Sealious = require("sealious");
var Promise = require("bluebird");

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
}

AccessStrategy.prototype = new function(){

	this.check = function(context, item){
		return Promise.resolve(this.type.check(context, this.params, item));
	}

	this.is_item_sensitive = function(){
		return this.type.is_item_sensitive(this.params);
	}
}

module.exports = AccessStrategy;
