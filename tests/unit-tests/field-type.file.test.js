var Sealious = require("sealious");

var assert_no_error = require("../util/assert-no-error.js");
var assert_error_type = require("../util/assert-error-type.js");

module.exports = {
	test_init: function(){

	},
	test_start: function(){
		var field_type_file = Sealious.ChipManager.get_chip("field_type", "file");
		describe("FieldType.File", function(){
			it("returns undefined", function(done){
				if (field_type_file.declaration.is_proper_value(new Sealious.Context(), {}, undefined) === undefined)
					done();
				else
					done(new Error("It didn't return undefined"));
			})
			it("accepts given value (which is an instance of Sealious.File)", function(done){
				var result = field_type_file.is_proper_value(new Sealious.Context(), {}, new Sealious.File());
				assert_no_error(result, done);
			})
			it("accepts given value (which is an object with filename and data attributes)", function(done){
				var value = {
					filename: "test_filename",
					data: new Buffer(1)
				}
				var result = field_type_file.is_proper_value(new Sealious.Context(), {}, value);
				assert_no_error(result, done);
			})
			it("rejects given value (which is an empty object)", function(done){
				var result = field_type_file.is_proper_value(new Sealious.Context(), {}, {});
				assert_error_type(result, "validation", done);
			})
			it("rejects given value (which is an array)", function(done){
				field_type_file.is_proper_value(new Sealious.Context(), {}, [])
				.then(function(){
					done(new Error("It didn't reject the value"));
				})
				.catch(function(error){
					done();
				})
			})
			/*
			it("checks if encode works correctly", function(done) {
				// to add

			})
*/
			it("checks if encode works correctly (value_in_code is false)", function(done){
				if (field_type_file.declaration.encode(new Sealious.Context(), {}, false) === null)
					done();
				else
					done(new Error("It didn't return null"));
			})
			it("checks if decode works correctly (value_in_database is false, params.no_file_value is not given)", function(done){
				if (field_type_file.declaration.decode(new Sealious.Context(), {}, false) === undefined)
					done();
				else
					done(new Error("It didn't return null"));
			})
			it("checks if decode works correctly (value_in_database is false, params.no_file_value is given)", function(done){
				if (field_type_file.declaration.decode(new Sealious.Context(), {no_file_value: "test"}, false) === "test")
					done();
				else
					done(new Error("It didn't return null"));
			})
		})
	}
}
