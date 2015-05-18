var Promise = require("bluebird");
var Chip = require("./chip.js");
 
function AccessStrategy(parent_module_path, name, declaration){
	Chip.call(this, parent_module_path, true, "access_strategy", name);
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

	this.check = function(context){
		var arguments_to_check_function = arguments;
		return new Promise(function(resolve, reject){
			this.checker_function.apply(this, arguments_to_check_function).then(function(){
				resolve()
			}).catch(function(error_message){
				if(typeof error_message == "string"){
					reject(new Sealious.Errors.BadContext(error_message));
				}else{
					rejec(error_message);
				}
			});	
		}.bind(this))
	}
}

AccessStrategy.type_name = "access_strategy";

module.exports = AccessStrategy;