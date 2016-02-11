var Sealious = require("sealious");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_email = Sealious.ChipManager.get_chip("field_type", "email");
		describe("FieldType.Email", function(){
			it("should return the description of the field type", function(done){
				if (typeof field_type_email.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly(given correct date format)", function(done){
				field_type_email.is_proper_value(new Sealious.Context(), {}, "test@mail.com")
				.then(function(){
					done();
				})
				.catch(function(error){
					done(new Error(error));
				})
			});
			it("should check if is_proper_value works correctly(given incorrect date format)", function(done){
				field_type_email.is_proper_value(new Sealious.Context(), {}, "test")
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