var Sealious = require("sealious");

module.exports = {
	test_init: function() {},

	test_start: function() {
		var field_type_text = Sealious.ChipManager.get_chip("field_type", "text");		
		describe("FieldType.Text", function() {
			it("should return the description of the field type", function(done) {	 
				if (typeof field_type_text.declaration.get_description(new Sealious.Context(), {max_length: 10}) === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly", function(done) {
				field_type_text.is_proper_value(new Sealious.Context(), {}, 2)
				.then(function() {
					done();
				})
				.catch(function(error) {
					done(new Error(error));
				})
			});
			it("should check if is_proper_value works correctly", function(done) {
				field_type_text.is_proper_value(new Sealious.Context(), {max_length: 5}, "123")
				.then(function() {
					done();
				})
				.catch(function(error) {
					done(new Error(error));
				})
			});
			it("should check if is_proper_value works correctly", function(done) {
				field_type_text.is_proper_value(new Sealious.Context(), {max_length: 5}, "asdfghjkl")
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
		});
	}
};