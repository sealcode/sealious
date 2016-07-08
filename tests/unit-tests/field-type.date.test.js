
var assert_no_error = require("../util/assert-no-error.js");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_date = Sealious.ChipManager.get_chip("field_type", "date");
		describe("FieldType.Date", function(){
			it("should return the description of the field type", function(done){
				if (typeof field_type_date.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly(given correct date format)", function(done){
				var result = field_type_date.is_proper_value(new Sealious.Context(), {}, "2015-10-27");
				assert_no_error(result, done);
			});
			it("should check if is_proper_value works correctly (given incorrect date format)", function(done){
				field_type_date.is_proper_value(new Sealious.Context(), {}, "2015/10/27")
				.then(function(){
					done(new Error("It worked correctly"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error));
				})
			});
		});
	}
};
