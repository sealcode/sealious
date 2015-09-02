var Sealious = require("../main.js");
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
	 * @param {any} value - value of this variable will be tested for compatibility with this field
	 * @return {Promise}
	 */
	this.isProperValue = function(value){
		return Promise.resolve();
	}
	/**
	 * Whether a given declariation is proper
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {object} declaration - value of this variable will be tested for compatibility with this field
	 * @return {Promise}
	 */
	this.validate_declaration = function(declaration){
		return Promise.resolve();
	}
	/**
	 * Encodes value given by user
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value_in_code - value to be encoded in proper format
	 * @return {Promise}
	 */
	this.encode = function(value_in_code){
		return Promise.resolve(value_in_code);
	}

	this.encode.uses_context = false;

	/**
	 * Decodes value from database
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value_in_database - value to be decoded to proper format
	 * @param {any} formatting_options - additional formatting options
	 * @return {Promise}
	 */
	this.decode = function(value_in_database, formatting_options){
		return Promise.resolve(value_in_database);
	}
	/**
	 * Adds params (merge with existing params)
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} param_map - hashmap of field-type params
	 * @return void
	 */
	this.set_params = function(param_map){
		if(this.params==undefined){
			this.params = param_map;
		}
		this.params = merge(this.params, param_map);
	}
	/**
	 * Set field name
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {string} fieldname - new field name 
	 * @return void
	 */
	this.set_fieldname = function(fieldname){
		this.fieldname = fieldname;
	}
	/**
	 * Gets params
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {Context} context - context in which mathod is used 
	 * @return {object} params - hashmap of field-type params
	 */
	this.get_params = function(context){
		return this.params;
	}
}

FieldType.is_a_constructor = true;

FieldType.type_name = "field_type";

module.exports = FieldType;