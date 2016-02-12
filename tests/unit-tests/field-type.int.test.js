var Sealious = require("sealious");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_int = Sealious.ChipManager.get_chip("field_type", "int");
		describe("FieldType.Int", function(){
			it("should return the description of the field type", function(done){
				if (typeof field_type_int.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly", function(done){
				field_type_int.is_proper_value(new Sealious.Context(), {}, 2)
				.then(function(){
					done();
				})
				.catch(function(error){
					done(new Error(error));
				})
			});
			it("should return error because new_value is not an integer", function(done){
				field_type_int.is_proper_value(new Sealious.Context(), {}, "janusz")
				.then(function(){
					done("But it didn't");
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error));
				})
			});
			it("should check if encode works properly (given \"2\")", function(done){
				if (field_type_int.declaration.encode(new Sealious.Context(), {}, "2") === 2)
					done();
				else
					done(new Error("It didn't parse the value correctly"));
			});
		});
	}
};