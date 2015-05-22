var Promise = require("bluebird");

function ResourceTypeField(declaration){
	this.name = declaration.name;
	this.type_name = declaration.type;
	this.human_readable_name = declaration.human_readable_name || null;
	var type_constructor = Sealious.ChipManager.get_chip("field_type", declaration.type);
	this.type_parameters = declaration.params;
	this.type = new type_constructor();
	this.type.set_params(declaration.params);
	this.type.set_fieldname(this.name);
	this.required = declaration.required || false;
	this.derived = declaration.derived || false;
}

ResourceTypeField.prototype = new function(){
	/**
	 * Shorthand for ResourceTypeField.type.isProperValue
	 * @alias ResourceTypeField#isProperValue
	 * @param  {object}  value
	 * @return {Promise}
	 */
	this.check_value = function(context, value){
		var _arguments;
		if(this.type.isProperValue.uses_context){
			_arguments = [context, value]
		}else{
			_arguments = [value]
		}
		return this.type.isProperValue.apply(this.type, _arguments)
		.catch(function(err){
			var new_error={};
			new_error[this.name] = err;
			return Promise.reject(new_error);
		}.bind(this));
	}

	/**
	 * Encodes a value for this field so it can be stored safey in database. Reverse of @link ResourceTypeField#decodeValue
	 * @alias ResourceTypeField#encodeValue
	 * @param  {any} value
	 * @param  {Boolean} as_hashmap
	 * @return {Promise}
	 */
	this.encode_value = function(context, value, as_hashmap){
		var encode_function = this.type.encode.bind(this.type);
		if(encode_function.uses_context){
			encode_function = encode_function.bind(context);
		}
		return encode_function(value)
		.then(function(encoded_value){
			if(as_hashmap){
				var ret = {};
				ret[this.name] = encoded_value;
				return Promise.resolve(ret);
			}else{
				return Promise.resolve(encoded_value);
			}
		}.bind(this));
	}

	/**
	 * @alias ResourceTypeField#decodeValue
	 * @todo Zaimplementować tę funkcję
	 */
	 this.decodeValue = function(){

	 }

	 this.get_signature = function(){
	 	var field_signature = {};
	 	field_signature.name = this.name;
	 	field_signature.type = this.type_name;
	 	field_signature.required = this.required;
	 	field_signature.human_readable_name = this.human_readable_name;
	 	return field_signature;
	 }
}

module.exports = ResourceTypeField;