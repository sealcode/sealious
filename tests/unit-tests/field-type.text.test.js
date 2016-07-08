var assert_no_error = require("../util/assert-no-error.js");
var assert_error_type = require("../util/assert-error-type.js");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_text = Sealious.ChipManager.get_chip("field_type", "text");
		describe("FieldType.Text", function(){
			it("returns the description of the field type", function(done){
				if (typeof field_type_text.declaration.get_description(new Sealious.Context(), {max_length: 10}) === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("checks if is_proper_value works correctly", function(done){
				var result = field_type_text.is_proper_value(new Sealious.Context(), {}, 2);
				assert_no_error(result, done);
			});
			it("checks if is_proper_value works correctly", function(done){
				var result = field_type_text.is_proper_value(new Sealious.Context(), {max_length: 5}, "123");
				assert_no_error(result, done);
			});
			it("checks if is_proper_value works correctly", function(done){
				var result = field_type_text.is_proper_value(new Sealious.Context(), {max_length: 5}, "asdfghjkl");
				assert_error_type(result, "validation", done);
			});
			it("checks if encode works properly (sanitizes html)", function(done){
				field_type_text.declaration.encode(new Sealious.Context(), {strip_html: true}, "outside<script>alert(\"a\")</script>")
				.then(function(result){
					if (result === "outside")
						done();
					else
						done("It didn't sanitize the string")
				}).catch(function(error){
					done(new Error(error));
				})
			});
			it("resolved with null when value_in_code is null", function(done){
				field_type_text.declaration.encode(new Sealious.Context(), {}, null)
				.then(function(result){
					if (result === null)
						done();
					else
						done(new Error("It didn't resolve with null"))
				})
				.catch(function(error){
					done(new Error(error));
				})
			})
			it("checks if encode works properly", function(done){
				var result = field_type_text.declaration.encode(new Sealious.Context(), {}, {});
				assert_no_error(result, done);
			});
		});
	}
};
