"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Errors = locreq("lib/response/error.js");
const Chip = locreq("lib/chip-types/chip.js");

function AccessStrategyType(app, declaration){
	if (declaration instanceof AccessStrategyType){
		return declaration;
	} else if (typeof declaration === "string"){
		return app.ChipManager.get_chip("access_strategy_type", declaration);
	}
	this.declaration = declaration;
	this.checker_function = null;
	this.name = declaration.name;
	this.app = app;
	if (declaration){
		this.checker_function = declaration.checker_function === undefined ? null : declaration.checker_function.bind(this);
	}
}

AccessStrategyType.type_name = "access_strategy_type";

AccessStrategyType.pure = {
	check: function(declaration, context, params, item){
		if (context.is_super){
			return Promise.resolve();
		}
		return AccessStrategyType.pure.is_item_sensitive(declaration, params)
		.then(function(is_item_sensitive){
			if (is_item_sensitive && item === undefined){
				return Promise.resolve(undefined);
			} else {
				return Promise.try(function(){
					return Promise.method(declaration.checker_function)(context, params, item)
					.then(function(result){
						if (result === false){
							return Promise.reject("Access denied");
						} else {
							return Promise.resolve(result);
						}
					});
				});
			}
		}).catch(function(error){
			if (typeof error === "string"){
				return Promise.reject(new Errors.BadContext(error));
			} else {
				return Promise.reject(error);
			}
		});
	},
	is_item_sensitive: function(declaration, params){
		if (typeof declaration.item_sensitive === "function"){
			return Promise.resolve(declaration.item_sensitive(params));
		} else {
			return Promise.resolve(Boolean(declaration.item_sensitive));
		}
	}
};

AccessStrategyType.prototype = {
	check(context, params, item){return AccessStrategyType.pure.check(this.declaration, context, params, item);},
	is_item_sensitive(params){return AccessStrategyType.pure.is_item_sensitive(this.declaration, params);},
};

module.exports = AccessStrategyType;
