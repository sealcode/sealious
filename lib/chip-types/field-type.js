var Sealious = require("sealious");
var Promise = require("bluebird");
var merge = require("merge");

var Chip = require("./chip.js");

var FieldTypeDescription = require("../data-structures/field-type-description.js");

/**
 * Stores field type metadata, as well as validation methods
 * @class
 */
 
function FieldType (declaration) {
	Chip.call(this, true, "field_type", declaration.name);

	this.old_value_sensitive_methods = declaration.old_value_sensitive_methods || false;

	this.process_declaration(declaration);
}

FieldType.prototype =  new function(){

	this.process_declaration = function(declaration){
		this.declaration = declaration;
		this.name = declaration.name;
		this.handles_large_data = declaration.handles_large_data==undefined?  false : true;

		if (declaration.extends) {
			this.parent_field_type = Sealious.ChipManager.get_chip("field_type", declaration.extends);
		} else {
			this.parent_field_type = null;
		}
	}

	this.is_old_value_sensitive = function(method_name){
		if (method_name == undefined) {
			if (typeof this.old_value_sensitive_methods == "boolean") {
				return this.old_value_sensitive_methods;
			} else {
				for (var i in this.old_value_sensitive_methods) {
					if (this.old_value_sensitive_methods[i]) {
						return true;
					}
				}
				return false;
			}
		} else {
			if (typeof this.old_value_sensitive_methods == "boolean") {
				return this.old_value_sensitive_methods;
			} else {
				return this.old_value_sensitive_methods[method_name];
			}
		}
	}


	this.get_method = function(method_name){
		var ret;
		if (this.declaration[method_name]) {
			ret = this.declaration[method_name];
		} else {
			ret = this["_" + method_name].bind(this);
		}
		return Promise.method(ret);
	}

	/**
	 * Whether a given value can be stored in this field type instance
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value - value of this variable will be tested for compatibility with this field
	 * @return {Promise}
	 */
	//to be decorated
	this._is_proper_value = function(accept){
		accept();
	}

	/**
	 * Whether a given declariation is proper
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {object} declaration - value of this variable will be tested for compatibility with this field
	 * @returns {Promise|Boolean}
	 *
	 */
	//to be decorated
	this.is_proper_declaration = function(declaration){
		return true;
	}

	/**
	 * Encodes value given by user
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value_in_code - value to be encoded in proper format
	 * @returns {Promise|Boolean}
	 */
	//to be decorated
	this._encode = function(context, params, value_in_code){
		return value_in_code;
	}

	//to be decorated
	this._get_description = function(){
		return new FieldTypeDescription(this.name);
	}

	this._encode.uses_context = false;

	/**
	 * Decodes value from database
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {Context} context
	 * @param {object} param - field params 
	 * @param {any} value_in_database - value to be decoded to proper format
	 * @return {Promise}
	 */
	//to be decorated
	this._decode = function(context, param, value_in_database){
		return value_in_database;
	}

	this._decode.uses_context = false;

	this.is_proper_value = function(context, params, new_value, old_value){
		var self = this;
		var validate_in_parent;
		if (this.declaration.extends) {
			validate_in_parent = this.parent_field_type.is_proper_value(context, params, new_value, old_value);
		} else {
			validate_in_parent = Promise.resolve();
		}
		return validate_in_parent.then(function(){
			return new Promise(function(resolve, reject){
				var new_reject = function(error_message){
					reject(new Sealious.Errors.ValidationError(error_message));
				}
				self.get_method("is_proper_value")(resolve, new_reject, context, params, new_value, old_value);
			});
		});
	}

	/**
	 * If a field-type has defined .decode method, use it. Otherwise use it's parent's or the default one
	 **/
	this.decode = function(context, params, value_in_database){
		if (this.declaration.extends && this.declaration.decode == undefined) {
			return this.parent_field_type.decode(context, params, value_in_database);
		} else {
			return this.get_method("decode")(context, params, value_in_database);
		}
	}

	/**

	 * If a field-type has defined .decode method, use it. Otherwise use it's parent's or the default one
	 **/
	this.encode = function(context, params, value_in_code){
		if (this.declaration.extends && this.declaration.encode == undefined) {
			return this.parent_field_type.encode(context, params, value_in_code);
		} else {
			return this.get_method("encode")(context, params, value_in_code);
		}
	}

	this.get_description = function(params){
		if (this.declaration.extends && this.declaration.get_description == undefined) {
			return this.parent_field_type.get_description(params)
		} else {
			return this.get_method("get_description")(params)
				.then(function(description){
					if (typeof description == "string") {
						return Promise.resolve(new FieldTypeDescription(description));
					} else {
						return Promise.resolve(description);
					}
				});
		}

	}
}

FieldType.type_name = "field_type";


module.exports = FieldType;