"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");

const AccessStrategy = function(app, declaration){
	if (declaration instanceof Array){
		this.type = new AccessStrategyType(app, declaration[0]);
		this.params = declaration[1] || {};
	} else if (typeof declaration === "string" || declaration instanceof AccessStrategyType){
		this.type = new AccessStrategyType(app, declaration);
		this.params = {};
	} else {
		this.type = new AccessStrategyType(app, declaration.type);
		this.params = declaration.params || {};
	}
};

AccessStrategy.type_name = "AccessStrategy";

AccessStrategy.prototype.check = function(context, item){
	return Promise.resolve(this.type.check(context, this.params, item));
};

AccessStrategy.prototype.is_item_sensitive = function(){
	return this.type.is_item_sensitive(this.params);
};

AccessStrategy.prototype.get_pre_aggregation_stage = function(context){
	return this.type.get_pre_aggregation_stage(context, this.params);
};

module.exports = AccessStrategy;
