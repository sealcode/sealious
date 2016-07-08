var assert_no_error = require("../util/assert-no-error.js");
var assert_error_type = require("../util/assert-error-type.js");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_float = Sealious.ChipManager.get_chip("field_type", "float");
		describe("FieldType.Float", function(){
			it("should return the description of the field type", function(done){
				if (typeof field_type_float.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly", function(done){
				var result = field_type_float.is_proper_value(new Sealious.Context(), {}, 2.5);
				assert_no_error(result, done);
			});
			it("should return error because new_value is not an integer", function(done){
				var result = field_type_float.is_proper_value(new Sealious.Context(), {}, "janusz");
				assert_error_type(result, "validation", done);
			});
			it("should check if encode works properly (given \"2\")", function(done){
				if (field_type_float.declaration.encode(new Sealious.Context(), {}, "2.5") === 2.5)
					done();
				else
					done(new Error("It didn't parse the value correctly"));
			});
		});
	}
};
