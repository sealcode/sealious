var Sealious = require("../main.js");
var Promise = require("bluebird");
var merge = require("merge");

var Chip = require("./chip.js");

/**
 * Stores field type metadata, as well as validation methods
 * @class
 */

function FieldType(name) {

	var instance = function() {};
	Chip.call(instance, true, "field_type", name);

	instance.prototype = Object.create(FieldType.prototype);

	return instance;
}

FieldType.prototype = new function() {
	/**
	 * Whether a given value can be stored in this field type instance
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value - value of this variable will be tested for compatibility with this field
	 * @return {Promise}
	 */
	//to be decorated
	this.isProperValue = function(value) {
		return true;
	}

	/**
	 * Whether a given declariation is proper
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {object} declaration - value of this variable will be tested for compatibility with this field
	 * @returns {Promise|Boolean}
	 */
	this.is_proper_declaration = function(declaration) {
		return true;
	}

	/**
	 * Encodes value given by user
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value_in_code - value to be encoded in proper format
	 * @returns {Promise|Boolean}
	 */
	this.encode = function(value_in_code) {
		return value_in_code;
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
	this.decode = function(value_in_database, formatting_options) {
			return value_in_database;
		}
		/**
		 * Adds params (merge with existing params)
		 * @memberOf  FieldType
		 * @abstract	
		 * @param {any} param_map - hashmap of field-type params
		 * @return void
		 */
	this.set_params = function(param_map) {
		if (this.params == undefined) {
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
	this.set_fieldname = function(fieldname) {
		this.fieldname = fieldname;
	}

	/**
	 * Gets params
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {Context} context - context in which mathod is used 
	 * @return {object} params - hashmap of field-type params
	 */
	this.get_params = function(context) {
		return this.params;
	}
}

FieldType.test_init = function() {
	var test_field_type = new Sealious.ChipTypes.FieldType("test_field_type");
}

FieldType.test_start = function() {
	describe("FieldType", function() {
		var test_field_type_constructor = Sealious.ChipManager.get_chip("field_type", "test_field_type");

		var test_field_type = new test_field_type_constructor();

		var but_it_didnt = new Error("But it didn't");

		describe("default .isProperValue", function() {
			it("should return true", function(done) {
				var return_value = test_field_type.isProperValue("any_value");
				if (typeof return_value != "boolean" || return_value != true) {
					done(but_it_didnt);
				} else {
					done();
				}
			});
		})

		describe("default .is_proper_declaration", function() {
			it("should return true", function(done) {
				var return_value = test_field_type.is_proper_declaration({});
				if (typeof return_value != "boolean" || return_value != true) {
					done(but_it_didnt);
				} else {
					done();
				}
			})
		});

		describe("default .encode", function() {
			it("should return what it's been fed", function(done) {
				var what_its_been_fed = "dogfood";
				var what_it_returned = test_field_type.encode(what_its_been_fed);
				if (what_it_returned != what_its_been_fed) {
					done(but_it_didnt)
				} else {
					done();
				}
			});
		});

		describe("default .decode", function() {
			it("should return what it's been fed", function(done) {
				var what_its_been_fed = "dogfood";
				var what_it_returned = test_field_type.decode(what_its_been_fed);
				if (what_it_returned != what_its_been_fed) {
					done(but_it_didnt)
				} else {
					done();
				}
			});
		});
	});
}

FieldType.is_a_constructor = true;

FieldType.type_name = "field_type";


module.exports = FieldType;