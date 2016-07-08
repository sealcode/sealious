
var assert_no_error = require("../util/assert-no-error.js");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_datetime = Sealious.ChipManager.get_chip("field_type", "datetime");
		describe("FieldType.Datetime", function(){
			it("should return the description of the field type", function(done){
				if (typeof field_type_datetime.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly(given timestamp)", function(done){
				var result = field_type_datetime.is_proper_value(new Sealious.Context(), {}, 1);
				assert_no_error(result, done);
			});
			it("should check if is_proper_value works correctly(given string)", function(done){
				field_type_datetime.is_proper_value(new Sealious.Context(), {}, "test")
				.then(function(){
					done(new Error("It worked correctly"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done()
					else
						done(new Error(error));
				})
			});
			it("should check if encode works properly (given \"1\")", function(done){
				if (field_type_datetime.declaration.encode(new Sealious.Context(), {}, "1") === 1)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
		});
	}
};
