
var assert_no_error = require("../util/assert-no-error.js");
var assert_error_type = require("../util/assert-error-type.js");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_boolean = Sealious.ChipManager.get_chip("field_type", "boolean");
		describe("FieldType.Boolean", function(){
			it("should return the description of the field type", function(done){
				if (typeof field_type_boolean.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly (given boolean)", function(done){
				var result = field_type_boolean.is_proper_value(new Sealious.Context(), {}, true);
				assert_no_error(result, done);
			});
			it("should check if is_proper_value works correctly (given 1)", function(done){
				var result = field_type_boolean.is_proper_value(new Sealious.Context(), {}, 1);
				assert_no_error(result, done);
			});
			it("should check if is_proper_value works correctly (given \"true\")", function(done){
				var result = field_type_boolean.is_proper_value(new Sealious.Context(), {}, "true");
				assert_no_error(result, done);
			});
			it("should check if is_proper_value works correctly (given 2)", function(done){
				var result = field_type_boolean.is_proper_value(new Sealious.Context(), {}, 2);
				assert_error_type(result, "validation", done);
			});
			it("should encode the value correctly (given boolean)", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, true) === true)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
			it("should encode the value correctly (given 1)", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, 1) === true)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
			it("should encode the value correctly (given 0)", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, 0) === false)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
			it("should encode the value correctly (given \"false\")", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, "false") === false)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
			it("should encode the value correctly (given \"true\")", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, "true") === true)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
		});
	}
};
