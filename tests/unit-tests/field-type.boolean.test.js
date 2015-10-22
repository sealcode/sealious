var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;


module.exports = {
	test_init: function() {
		var resource_type_boolean = new Sealious.ChipTypes.ResourceType({
			name: "boolean_resource",
			fields: [
				{name: "test", type: "boolean", required: true}
			]
		});
	},

	test_start: function() {
		describe("FieldType.Boolean", function() {
			it("should validate the email field successfully with boolean true and return true", function(done) {
				ResourceManager.create(new Sealious.Context(), "boolean_resource", {test: true})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			})
			it("should validate the email field successfully with 1 and return true", function(done) {
				ResourceManager.create(new Sealious.Context(), "boolean_resource", {test: 1})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			})
			it("should validate the email field successfully with string true and return true", function(done) {
				ResourceManager.create(new Sealious.Context(), "boolean_resource", {test: "true"})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			})
			it("should throw an error with string", function(done) {
				ResourceManager.create(new Sealious.Context(), "boolean_resource", {test: "silly sealy"})
				.then(function(ok){
					done(new Error("it validated it correctly"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error with number", function(done) {
				ResourceManager.create(new Sealious.Context(), "boolean_resource", {test: 123456789})
				.then(function(ok){
					done(new Error("it validated it correctly"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should return false with 0", function(done) {
				ResourceManager.create(new Sealious.Context(), "boolean_resource", {test: 0})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(new Error(error));
				})
			})
			it("should return false with string false", function(done) {
				ResourceManager.create(new Sealious.Context(), "boolean_resource", {test: "false"})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(new Error(error));
				})
			})
			it("should throw an error because of no value", function(done){
				ResourceManager.create(new Sealious.Context(), "boolean_resource", {})
				.then(function(ok){
					done(new Error("but it didn't"));
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