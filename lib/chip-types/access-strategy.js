"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");

const AccessStrategy = function(app, declaration) {
	this.app = app;
	if (declaration instanceof Array) {
		this.type = new AccessStrategyType(app, declaration[0]);
		this.params = declaration[1] || {};
	} else if (
		typeof declaration === "string" ||
		declaration instanceof AccessStrategyType
	) {
		this.type = new AccessStrategyType(app, declaration);
		this.params = {};
	} else {
		this.type = new AccessStrategyType(app, declaration.type);
		this.params = declaration.params || {};
	}
};

AccessStrategy.type_name = "AccessStrategy";

AccessStrategy.prototype.check = async function(context, sealious_response) {
	if (!context.is_super) {
		return this.type.check(context, this.params, sealious_response);
	}
};

AccessStrategy.prototype.is_item_sensitive = function() {
	return this.type.is_item_sensitive(this.params);
};

AccessStrategy.prototype.getRestrictingQuery = async function(context) {
	if (context.is_super) {
		return new this.app.Query.AllowAll();
	}
	return this.type.getRestrictingQuery(context, this.params);
};

module.exports = AccessStrategy;
