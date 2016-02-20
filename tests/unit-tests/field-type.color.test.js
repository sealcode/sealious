var Sealious = require("sealious");

var assert_error_type = require("../util/assert-error-type.js");
var assert_no_error = require("../util/assert-no-error.js");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_color = Sealious.ChipManager.get_chip("field_type", "color");
		describe("FieldType.Color", function(){
			it("checks if is_proper_value throws an error (wrong value)", function(done){
				var result = field_type_color.is_proper_value(new Sealious.Context(), {}, "aaaa");
				assert_error_type(result, "validation", done);
			})
			it("checks if is_proper_value works correctly (given \"rgb(255, 255, 255)\"", function(done){
				var result = field_type_color.is_proper_value(new Sealious.Context(), {}, "rgb(255, 255, 255)");
				assert_no_error(result, done);
			})
			it("checks if is_proper_value works correctly (given \"black\"", function(done){
				var result = field_type_color.is_proper_value(new Sealious.Context(), {}, "black");
				assert_no_error(result, done);
			})
			it("checks if is_proper_value works correctly (given \"BLACK\"", function(done){
				var result = field_type_color.is_proper_value(new Sealious.Context(), {}, "BLACK");
				assert_no_error(result, done);
			})
			it("checks if is_proper_value works correctly (given \"#000000\"", function(done){
				var result = field_type_color.is_proper_value(new Sealious.Context(), {}, "#000000");
				assert_no_error(result, done);
			})
			it("checks if is_proper_value works correctly (given \"{r: 255, g: 255, b: 255}\"", function(done){
				var result = field_type_color.is_proper_value(new Sealious.Context(), {}, {r: 255, g: 255, b: 255});
				assert_no_error(result, done);
			})
			it("checks if is_proper_value works correctly (given \"hsla(262, 59%, 81%, 0.5)\"", function(done){
				var result = field_type_color.is_proper_value(new Sealious.Context(), {}, "hsla(262, 59%, 81%, 0.5)");
				assert_no_error(result, done);
			})
			it("checks if encode works correctly", function(done){
				if (field_type_color.declaration.encode(new Sealious.Context(), {}, {r: 0, g: 0, b: 0}) === "#000000")
					done();
				else
					done("It didnt work correctly");
			})
			it("checks if encode works correctly", function(done){
				if (field_type_color.declaration.encode(new Sealious.Context(), {}, "black") === "#000000")
					done();
				else
					done("It didnt work correctly");
			})
			it("checks if encode works correctly", function(done){
				if (field_type_color.declaration.encode(new Sealious.Context(), {}, "hsl(0,0%,0%)") === "#000000")
					done();
				else
					done("It didnt work correctly");
			})
		})
	}
}
