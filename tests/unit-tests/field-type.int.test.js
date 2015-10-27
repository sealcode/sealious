var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;

module.exports = {
	test_init: function() {
		/*
		var resource_type_int = new Sealious.ChipTypes.ResourceType({
			name: "int_resource",
			fields: [
				{name: "test", type: "int", required: true}
			]
		});
		*/
	},

	test_start: function() {
		var field_type_int = Sealious.ChipManager.get_chip("field_type", "int");

		console.log("!@!", typeof field_type_int.get_method)

		console.log("field_type_int", field_type_int.declaration.get_description())
		
		describe("FieldType.Int", function() {
			it("should return the description of the field type", function(done) {
				var test = field_type_int.declaration.get_description()
				.then(function(){
					done();
				})
			});
		});
		/*
		describe("FieldType.Int", function() {
			it("should validate the int field successfully (given int)", function(done) {
				ResourceManager.create(new Sealious.Context(), "int_resource", {test: 1})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			})
			it("should not validate the int field successfully (given float)", function(done) {
				ResourceManager.create(new Sealious.Context(), "int_resource", {test: 1.2})
				.then(function(ok){
					done(new Error("but it did..."));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should not validate the int field successfully (given string)", function(done) {
				ResourceManager.create(new Sealious.Context(), "int_resource", {test: "silly sealy"})
				.then(function(ok){
					done(new Error("but it did..."));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should not validate the int field successfully (no value)", function(done) {
				ResourceManager.create(new Sealious.Context(), "int_resource", {})
				.then(function(ok){
					done(new Error("but it did..."));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
		})
		*/
	}
};