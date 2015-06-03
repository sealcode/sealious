var Promise = require("bluebird");

function ResourceTypeField(declaration, resource_type) {
    this.name = declaration.name;
    this.type_name = declaration.type;
    this.human_readable_name = declaration.human_readable_name || null;

    if(!Sealious.ChipManager.chip_exists("field_type", this.type_name)) {
    	throw new Sealious.Errors.DeveloperError("In declaration of resource type '" + resource_type.name +"': unknown field type '"+this.type_name+"' in field '"+this.name+"'.");
    } 
    var type_constructor = Sealious.ChipManager.get_chip("field_type", declaration.type);
    this.type_parameters = declaration.params;
    this.type = new type_constructor();
    this.type.set_params(declaration.params);
    this.type.init && this.type.init();
    this.required = declaration.required || false;
    this.derived = declaration.derived || false;
};

ResourceTypeField.prototype = new function(){
	/**
	 * Shorthand for ResourceTypeField.type.isProperValue
	 * @alias ResourceTypeField#isProperValue
	 * @param  {object}  value
	 * @return {Promise}
	 */
	this.check_value = function(context, value, old_value){
		var _arguments;
		if(this.type.isProperValue.uses_context){
			_arguments = [context, value, old_value]
		}else{
			_arguments = [value, old_value]
		}
		var ret = this.type.isProperValue.apply(this.type, _arguments);
		return ret;
		/*
		.catch(function(err){
			console.log("caught error", err);
			var new_error={};
			new_error[this.name] = err;
			return Promise.reject(new_error);
		}.bind(this));
		*/
	}

	function to_map(name, value){
		var obj = {};
		obj[name] = value;
		return Promise.resolve(obj);
	}


	this.has_previous_value_sensitive_methods = function(){
		if (this.encode_value.old_value_sensitive || this.decodeValue.old_value_sensitive || this.type.old_value_sensitive)
			return true;

		return false;
	}

	this.encode_value = function(context, value, old_value){
		var _arguments;
		if(this.type.encode.uses_context){
			_arguments = [context, value];
		}else{
			_arguments = [value];
		}
		if(this.type.old_value_sensitive){
			_arguments.push(old_value)
		}
		return this.type.encode.apply(this.type, _arguments);
	}


	this.decode_value = function(context, value){
		if(this.type.decode.uses_context){
			_arguments = [context, value];
		}else{
			_arguments = [value];
		}
		var decode_value = this.type.decode.apply(this.type, _arguments);
		return decode_value;
	}

	this.get_signature = function(){
		var field_signature = {};
		field_signature.name = this.name;
		field_signature.type = this.type_name;
		field_signature.required = this.required;
		field_signature.human_readable_name = (typeof this.human_readable_name=="string")? this.human_readable_name : undefined;
		field_signature.params = this.type.get_params();
		return field_signature;
	}
}

module.exports = ResourceTypeField;