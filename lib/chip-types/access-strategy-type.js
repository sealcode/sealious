var Sealious = require("sealious");
var Promise = require("bluebird");
var Chip = require("./chip.js");

function AccessStrategyType (declaration) {
	if (declaration instanceof AccessStrategyType){
		return declaration;
	} else if (typeof declaration === "string"){
		return Sealious.ChipManager.get_chip("access_strategy_type", declaration);
	}
	Chip.call(this, "access_strategy_type", declaration.name);
	this.declaration = declaration;
	this.checker_function = null;
	this.name = declaration.name;
	if (declaration) {
		this._process_declaration(declaration);
	}
}

AccessStrategyType.prototype = new function(){

	this._process_declaration = function(declaration){
		this.checker_function = declaration.checker_function === undefined ? null : declaration.checker_function;
	}

	this.set_checker_function = function(checker_function){
		this.checker_function = checker_function;
	}

	this.__check = function(declaration, context, params, item){
		if (context.is_super){
			return Promise.resolve();
		}
		return this.__is_item_sensitive(declaration, params)
		.then(function(is_item_sensitive){
			if (is_item_sensitive && item === undefined){
				return Promise.resolve(undefined);
			} else {
				return Promise.try(function(){
					return declaration.checker_function(context, params, item);
				})
			}
		}).catch(function(error){
			if (typeof error === "string") {
				return Promise.reject(new Sealious.Errors.BadContext(error));
			} else {
				return Promise.reject(error);
			}
		});
	}

	this.check = function(context, params, item){
		return this.__check(this.declaration, context, params, item);
	}

	this.__is_item_sensitive = function(declaration, params){
		if (typeof declaration.item_sensitive === "function"){
			return Promise.resolve(declaration.item_sensitive(params));
		} else {
			return Promise.resolve(Boolean(declaration.item_sensitive));
		}
	}

	this.is_item_sensitive = function(params){
		return this.__is_item_sensitive(this.declaration, params);
	}
}

AccessStrategyType.type_name = "access_strategy_type";

module.exports = AccessStrategyType;
