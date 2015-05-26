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

	function to_map(name, value){
		var obj = {};
		obj[name] = value;
		return Promise.resolve(obj);
	}

	this.encode_value = function(context, value){
		var _arguments;
		if(this.type.encode.uses_context){
			_arguments = [context, value];
		}else{
			_arguments = [value];
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
		field_signature.human_readable_name = this.human_readable_name;
		field_signature.params = this.type.get_params();
		return field_signature;
	}
}

module.exports = ResourceTypeField;