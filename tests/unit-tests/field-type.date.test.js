var Sealious = require("sealious");

module.exports = {
	test_init: function() {},

	test_start: function() {
		var field_type_date = Sealious.ChipManager.get_chip("field_type", "date");
		describe("FieldType.Date", function() {
			it("should return the description of the field type", function(done) {
				if (typeof field_type_date.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly(given correct date format)", function(done) {
				field_type_date.is_proper_value(new Sealious.Context(), {}, "2015-10-27")
				.then(function() {
					done();
				})
				.catch(function(error) {
					done(new Error(error));
				})
			});
			it("should check if is_proper_value works correctly(given incorrect date format)", function(done) {
				field_type_date.is_proper_value(new Sealious.Context(), {}, "2015/10/27")
				.then(function() {
					done(new Error("It worked correctly"));
				})
				.catch(function(error) {
					if (error.type === "validation")
						done();
					else 
						done(new Error(error));
				})
			});
			it("should check if encode works properly (given \"2015/10/27\")", function(done) {
				if (field_type_date.declaration.encode(new Sealious.Context(), {}, "2015/10/27") === 1445900400000)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
		});
	}
};