var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;

module.exports = {
	test_init: function() {
		var resource_type_float = new Sealious.ChipTypes.ResourceType({
			name: "float_resource",
			fields: [
				{name: "test", type: "float", required: true}
			]
		});
	},

	test_start: function() {
		describe("FieldType.Float", function(){
			it("should validate the float field successfully (given float)", function(done) {
				ResourceManager.create(new Sealious.Context(), "float_resource", {test: 1.2})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			})
			it("should check if the float value like 1.0 was stored in the database correctly", function(done) {
				var context = new Sealious.Context();
				ResourceManager.create(context, "float_resource", {test: 1.0})
				.then(function(ok){
					ResourceManager.find(context, {test: 1.0}, "float_resource")
					.then(function(result){
						if (result[0].test === 1.0)
							done();
						else
							done(new Error("Not the same number"))
					})
					.catch(function(error){
						done(error)
					})
				})
				.catch(function(error){
					done(error);
				})
			})
			it("should validate the float field successfully (given int)", function(done) {
				ResourceManager.create(new Sealious.Context(), "float_resource", {test: 1})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			})
			it("should not validate the float field successfully (given string)", function(done) {
				ResourceManager.create(new Sealious.Context(), "float_resource", {test: "silly sealy"})
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
			it("should not validate the float field successfully (no value)", function(done) {
				ResourceManager.create(new Sealious.Context(), "float_resource", {})
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
	}
};