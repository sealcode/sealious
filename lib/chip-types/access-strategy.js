var Sealious = require("../main.js");
var Promise = require("bluebird");
var Chip = require("./chip.js");

function AccessStrategy(parent_module_path, declaration){
	if(typeof declaration.name!="string"){
		throw new Sealious.Errors.DeveloperError("Access strategy declaration has an invalid or missing `name` attribute");
	}
	Chip.call(this, parent_module_path, true, "access_strategy", declaration.name);
	this.checker_function = null;
	this.item_sensitive = false;
	if(declaration) this._process_declaration(declaration);
}

AccessStrategy.prototype  =  new function(){

	this._process_declaration = function(declaration){
		this.checker_function =  declaration.checker_function===undefined? null : declaration.checker_function;		
		if(declaration.item_sensitive!==undefined){
			this.item_sensitive = declaration.item_sensitive;
		}
	}

	this.set_checker_function = function(checker_function){
		this.checker_function = checker_function;
	}

	this.check = function(context, item){
		var arguments_to_check_function = arguments;
		return this.checker_function.apply(this, arguments_to_check_function)
		.then(function(){
			return Promise.resolve(item);
		}).catch(function(error_message){
			if(typeof error_message == "string"){
				return Promise.reject(new Sealious.Errors.BadContext(error_message));
			}else{
				return Promise.reject(error_message);
			}
		});	
	}
}

AccessStrategy.type_name = "access_strategy";

module.exports = AccessStrategy;