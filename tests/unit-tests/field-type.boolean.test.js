var Sealious = require("sealious");

module.exports = {
	test_init: function(){},

	test_start: function(){
		var field_type_boolean = Sealious.ChipManager.get_chip("field_type", "boolean");
		describe("FieldType.Boolean", function(){
			it("should return the description of the field type", function(done){
				if (typeof field_type_boolean.declaration.get_description() === "string")
					done();
				else
					done(new Error("But it didn't"));
			});
			it("should check if is_proper_value works correctly (given boolean)", function(done){
				field_type_boolean.is_proper_value(new Sealious.Context(), {}, true)
				.then(function(){
					done();
				})
				.catch(function(error){
					done(new Error(error));
				})
			});
			it("should check if is_proper_value works correctly (given 1)", function(done){
				field_type_boolean.is_proper_value(new Sealious.Context(), {}, 1)
				.then(function(){
					done();
				})
				.catch(function(error){
					done(new Error(error));
				})
			});
			it("should check if is_proper_value works correctly (given \"true\")", function(done){
				field_type_boolean.is_proper_value(new Sealious.Context(), {}, "true")
				.then(function(){
					done();
				})
				.catch(function(error){
					done(new Error(error));
				})
			});
			it("should check if is_proper_value works correctly (given 2)", function(done){
				field_type_boolean.is_proper_value(new Sealious.Context(), {}, 2)
				.then(function(){
					done(new Error("It didn't throw an error"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error));
				})
			});
			it("should encode the value corretly (given boolean)", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, true) === true)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
			it("should encode the value corretly (given 1)", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, 1) === true)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
			it("should encode the value corretly (given 0)", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, 0) === false)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
			it("should encode the value corretly (given \"false\")", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, "false") === false)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
			it("should encode the value corretly (given \"true\")", function(done){
				if (field_type_boolean.declaration.encode(new Sealious.Context(), {}, "true") === true)
					done();
				else
					done(new Error("It didn't parse the value correctly"))
			});
		});
	}
};