var Sealious = require("../main.js");

var Promise = require("bluebird");

/**
 * !! resource_type is optional, needen only for nice errors
 *
 */

function ResourceTypeField (declaration, resource_type) {
	this.name = declaration.name;
	this.type_name = declaration.type;
	this.human_readable_name = declaration.human_readable_name || null;

	if (!Sealious.ChipManager.chip_exists("field_type", this.type_name)) {
		throw new Sealious.Errors.DeveloperError("In declaration of resource type '" + resource_type.name + "': unknown field type '" + this.type_name + "' in field '" + this.name + "'.");
	}
	this.params = declaration.params;
	this.default_value = declaration.default_value;
	this.type = Sealious.ChipManager.get_chip("field_type", declaration.type);

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
		return this.type.is_proper_value(context, this.params, value, old_value);
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
		if (this.type.decode.uses_context) {
			_arguments = [context, value_in_database];
		} else {
			_arguments = [value_in_database];
		}
		var decode_value = this.type.decode.apply(this.type, _arguments);
		return decode_value;
	}

	this.get_signature = function(with_validator){
		//with_validator:boolean - whether to include validator function in field description. Warning! If set to true, the output is not serializable in JSON.
		var field_signature = {};
		field_signature.name = this.name;
		field_signature.type = this.type_name;
		field_signature.required = this.required;
		field_signature.human_readable_name = (typeof this.human_readable_name == "string") ? this.human_readable_name : undefined;
		field_signature.params = this.params;
		field_signature.validate = this.check_value.bind(this);
		field_signature.default_value = this.default_value;
		return field_signature;
	}

	this.get_nice_name = function(){
		return this.human_readable_name || this.name;
	}
}

ResourceTypeField.test_start = function(){
	describe("ResourceTypeField", function(){
		describe("constructor", function(){
			it("should throw a nice error when non-existent field type is provided in declaration", function(done){
				try {
					var test_field = new ResourceTypeField({
						name: "test_field",
						type: "truly_non_existent_field_type",
					}, {
						name: "fake_resource_type"
					});
				} catch (error) {
					if (error.is_developer_fault == true) {
						done();
					} else {
						done(new Error("But it threw a non-nice error."));
					}
					return;
				}
				done(new Error("But it didn't throw any error at all"));
			});
		})
	})
}

module.exports = ResourceTypeField;