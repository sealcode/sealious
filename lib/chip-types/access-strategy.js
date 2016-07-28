const Promise = require("bluebird");
const AccessStrategyType = require.main.require("lib/chip-types/access-strategy-type.js");

const AccessStrategy = function(declaration){
	if (declaration instanceof Array){
		this.type = new AccessStrategyType(declaration[0]);
		this.params = declaration[1] || {};
	} else if (typeof declaration === "string" || declaration instanceof AccessStrategyType){
		this.type = new AccessStrategyType(declaration);
		this.params = {};
	} else {
		this.type = new AccessStrategyType(declaration.type);
		this.params = declaration.params || {};
	}
};

AccessStrategy.prototype = new function(){

	this.check = function(context, item){
		return Promise.resolve(this.type.check(context, this.params, item));
	};

	this.is_item_sensitive = function(){
		return this.type.is_item_sensitive(this.params);
	};
};

module.exports = AccessStrategy;
