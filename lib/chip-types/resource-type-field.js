var Promise = require("bluebird");
var Sealious = require("sealious");

function ResourceTypeField (declaration, resource_type) {
	this.name = declaration.name;
	this.resource_type = resource_type;

	if (typeof declaration.type === "string"){
		if (!Sealious.ChipManager.chip_exists("field_type", declaration.type)) {
			throw new Sealious.Errors.DeveloperError("In declaration of resource type '" + resource_type.name + "': unknown field type '" + this.type_name + "' in field '" + this.name + "'.");
		}
		this.type = Sealious.ChipManager.get_chip("field_type", declaration.type);
	} else if (declaration.type instanceof Sealious.FieldType){
		this.type = declaration.type;
	} else {
		throw new Sealious.Errors.DeveloperError("Bad field type declaration: " + declaration.type);
	}

	this.human_readable_name = declaration.human_readable_name || null;

	this.params = declaration.params;
	this.default_value = declaration.default_value;

	if (this.type.init){
		this.type.init();
	}

	this.required = declaration.required || false;
	this.derived = declaration.derived || false;
}

ResourceTypeField.prototype = new function(){
	this.check_value = function(context, value, old_value){
		if (value === undefined && !this.required){
			return Promise.resolve();
		} else {
			return this.type.is_proper_value(context, this.params, value, old_value);
		}
	}

	function to_map (name, value) {
		var obj = {};
		obj[name] = value;
		return Promise.resolve(obj);
	}

	this.is_old_value_sensitive = function(method_name){
		return this.type.is_old_value_sensitive(method_name);
	}

	this.encode_value = function(context, new_value, old_value){
		return this.type.encode(context, this.params, new_value, old_value);
	}

	this.decode_value = function(context, value_in_database){
		return this.type.decode(context, this.params, value_in_database);
	}

	this.get_specification = function(with_validator){
		//with_validator:boolean - whether to include validator function in field description. Warning! If set to true, the output is not serializable in JSON.
		var field_specification = {};
		field_specification.name = this.name;
		field_specification.type = this.type.name;
		field_specification.required = this.required;
		field_specification.human_readable_name = (typeof this.human_readable_name === "string") ? this.human_readable_name : undefined;
		field_specification.params = this.params;
		field_specification.validate = this.check_value.bind(this);
		field_specification.default_value = this.default_value;
		return field_specification;
	}

	this.get_nice_name = function(){
		return this.human_readable_name || this.name;
	}

}

module.exports = ResourceTypeField;
