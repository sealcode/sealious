var Promise = require("bluebird");
var merge = require("merge");

var Chip = require("./chip.js");

/**
 * Stores field type metadata, as well as validation methods
 * @class
 */
 
function FieldType(parent_module_path, name){

	var instance = function(){};
	Chip.call(instance, parent_module_path, true, "field_type", name);

	instance.prototype = Object.create(FieldType.prototype);

	return instance;
}

FieldType.prototype =  new function(){
	/**
	 * Whether a given value can be stored in this field type instance
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value value of this variable will be tested for compatibility with this field
	 * @return {Promise}
	 */
	this.isProperValue = function(value){
		return Promise.resolve();
	}

	this.validate_declaration = function(declaration){
		return Promise.resolve();
	}

	this.encode = function(value_in_code){
		return Promise.resolve(value_in_code);
	}

	this.decode = function(value_in_database, formatting_options){
		return Promise.resolve();
	}

	this.set_params = function(param_map){
		if(this.params==undefined){
			this.params = param_map;
		}
		this.params = merge(this.params, param_map);
	}
}

FieldType.is_a_constructor = true;

FieldType.type_name = "field_type";

module.exports = FieldType;