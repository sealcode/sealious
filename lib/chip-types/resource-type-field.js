var Promise = require("bluebird");

function ResourceTypeField(declaration, resource_type) {
    this.name = declaration.name;
    this.type_name = declaration.type;
    this.human_readable_name = declaration.human_readable_name || null;
    var type_constructor = Sealious.ChipManager.get_chip("field_type", declaration.type);
    this.type_parameters = declaration.params;

    if(Sealious.ChipManager.chip_exists("field_type", this.type_name) === true) {
        this.type = new type_constructor();
        this.type.set_params(declaration.params);
        this.required = declaration.required || false;
        this.derived = declaration.derived || false;
    } else {
        throw new Sealious.Errors.DeveloperError("In declaration of resource type '" + resource_type.name +"': unknown field type '"+this.type_name+"' in field '"+this.name+"'.");
    }
};

ResourceTypeField.prototype = new function(){
	/**
	 * Shorthand for ResourceTypeField.type.isProperValue
	 * @alias ResourceTypeField#isProperValue
	 * @param  {object}  value
	 * @return {Promise}
	 */
	this.isProperValue = function(value, dispatcher){
		var that = this;
		return new Promise(function(resolve, reject){
			that.type.isProperValue(value, dispatcher).then(
				resolve,
				function(err){
					/*
					//older version, not compliant with #132
					var new_error = {
						field_name: that.name,
						error_message: err
					}
					*/
					var new_error={};
					new_error[that.name] = err;
					reject(new_error);
				}
			);
		})
	}

	/**
	 * Encodes a value for this field so it can be stored safey in database. Reverse of @link ResourceTypeField#decodeValue
	 * @alias ResourceTypeField#encodeValue
	 * @param  {any} value
	 * @param  {Boolean} as_hashmap
	 * @return {Promise}
	 */
	this.encode_value = function(value, as_hashmap){
		var that = this;
		return this.type.encode(value).then(function(encoded_value){
			var ret_promise = new Promise(function(resolve, reject){
				if(as_hashmap){
					var ret = {};
					ret[that.name] = encoded_value;
					resolve(ret);
				}else{
					resolve(encoded_value);
				}
			})
			return ret_promise;
		});
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