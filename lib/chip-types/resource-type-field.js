var Sealious = require("../main.js");

var Promise = require("bluebird");

/**
 * !! resource_type is optional, needen only for nice errors
 *
 */

function ResourceTypeField(declaration, resource_type) {
	this.name = declaration.name;
	this.type_name = declaration.type;
	this.human_readable_name = declaration.human_readable_name || null;

	if (!Sealious.ChipManager.chip_exists("field_type", this.type_name)) {
		throw new Sealious.Errors.DeveloperError("In declaration of resource type '" + resource_type.name + "': unknown field type '" + this.type_name + "' in field '" + this.name + "'.");
	}
	var type_constructor = Sealious.ChipManager.get_chip("field_type", declaration.type);
	this.type_parameters = declaration.params;
	this.default_value = declaration.default_value;
	this.type = new type_constructor();
	this.type.set_params(declaration.params);
	this.type.init && this.type.init();
	this.required = declaration.required || false;
	this.derived = declaration.derived || false;
};

ResourceTypeField.prototype = new function() {
	/**
	 * Shorthand for ResourceTypeField.type.isProperValue
	 * @alias ResourceTypeField#isProperValue
	 * @param  {object}  value
	 * @return {Promise}
	 */
	this.check_value = function(context, value, old_value) {
			return this.type.isProperValue(context, value, old_value);
		}
		/**
		 * Creates map object.name = value
		 * @param  {String}  name
		 * @param  {String}  value
		 * @return {Promise} resolving with object, where object.name = value
		 */
	function to_map(name, value) {
		var obj = {};
		obj[name] = value;
		return Promise.resolve(obj);
	}

	/**
	 * Checks if field has previous value sensitive methods
	 * @return {Boolean}
	 */
	this.has_previous_value_sensitive_methods = function() {
		if (this.encode_value.old_value_sensitive || this.decodeValue.old_value_sensitive || this.type.old_value_sensitive)
			return true;

		return false;
	}


	/**
	 * 	It's a wrapper, which checks if encode_value function uses context or previous value, and if it does adds it to arguments. 
	 * @return {} encoded value
	 */
	this.encode_value = function(context, value, old_value) {
		var _arguments;
		if (this.type.encode.uses_context) {
			_arguments = [context, value];
		} else {
			_arguments = [value];
		}
		if (this.type.old_value_sensitive) {
			_arguments.push(old_value)
		}
		return this.type.encode.apply(this.type, _arguments);
	}

	/**
	 * 	It's a wrapper, which checks if decode_value function uses context, and if it does adds it to arguments. 
	 * @returns {} decoded value
	 */
	this.decode_value = function(context, value_in_database) {
			if (this.type.decode.uses_context) {
				_arguments = [context, value_in_database];
			} else {
				_arguments = [value_in_database];
			}
			var decode_value = this.type.decode.apply(this.type, _arguments);
			return decode_value;
		}
		/**
		 * Gets field signature: name, type, required, human redable name, params, validator function, default value
		 * @param {Boolean} with validator - - whether to include validator function in field description. 
		 * Warning! If set to true, the output is not serializable in JSON.
		 * @returns {} field signature
		 */
	this.get_signature = function(with_validator) {
		var field_signature = {};
		field_signature.name = this.name;
		field_signature.type = this.type_name;
		field_signature.required = this.required;
		field_signature.human_readable_name = (typeof this.human_readable_name == "string") ? this.human_readable_name : undefined;
		field_signature.params = this.type.get_params();
		field_signature.validate = this.check_value.bind(this);
		field_signature.default_value = this.default_value;
		return field_signature;
	}
}

ResourceTypeField.test_start = function() {
	describe("ResourceTypeField", function() {
		describe("constructor", function() {
			it("should throw a nice error when non-existent field type is provided in declaration", function(done) {
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