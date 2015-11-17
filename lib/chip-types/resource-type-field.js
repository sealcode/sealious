var Sealious = require("sealious");

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
		throw new Sealious.Errors.DeveloperError("In declaration of resource type '" + resource_type.name +"': unknown field type '"+this.type_name+"' in field '"+this.name+"'.");
	} 
	this.params = declaration.params;
	this.default_value = declaration.default_value;
	this.type = Sealious.ChipManager.get_chip("field_type", declaration.type);

	structure_name = declaration.structure || "single";
	if (Sealious.FieldStructures[structure_name]){
		this.structure = Sealious.FieldStructures[structure_name];
	} else {
		throw new Sealious.Errors.DeveloperError("In declaration of resource type '" + resource_type.name +"': unknown field structure '"+structure_name+"' in field '"+this.name+"'.");
	}

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
	/**
	 * Creates map object.name = value
	 * @param  {String}  name
	 * @param  {String}  value
	 * @return {Promise} resolving with object, where object.name = value
 	 */
	function to_map (name, value) {
		var obj = {};
		obj[name] = value;
		return Promise.resolve(obj);
	}

	/**
	 * Checks if field has previous value sensitive methods
	 * @params method_name:String - which field-type method to check
	 * @return {Boolean}
 	 */
	this.is_old_value_sensitive = function(method_name){
		return this.type.is_old_value_sensitive(method_name);
	}


	/**
	 * 	It's a wrapper, which checks if encode_value function uses context or previous value, and if it does adds it to arguments. 
	 * @return {} encoded value
 	 */
	this.encode_value = function(context, new_value, old_value){
		return this.type.encode(context, this.params, new_value, old_value);
	}

	/**
	 * 	It's a wrapper, which checks if decode_value function uses context, and if it does adds it to arguments. 
	 * @returns {} decoded value
 	 */
	this.decode_value = function(context, value_in_database){
		return this.type.decode(context, this.params, value_in_database);
	}

	/**
	* Gets field signature: name, type, required, human redable name, params, validator function, default value
	* @param {Boolean} with validator - - whether to include validator function in field description. 
	* Warning! If set to true, the output is not serializable in JSON.
	* @returns {} field signature
	*/
	this.get_specification = function(with_validator){
		//with_validator:boolean - whether to include validator function in field description. Warning! If set to true, the output is not serializable in JSON.
		var field_specification = {};
		field_specification.name = this.name;
		field_specification.type = this.type_name;
		field_specification.required = this.required;
		field_specification.human_readable_name = (typeof this.human_readable_name == "string") ? this.human_readable_name : undefined;
		field_specification.params = this.params;
		field_specification.validate = this.check_value.bind(this);
		field_specification.default_value = this.default_value;
		return field_specification;
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