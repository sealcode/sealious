var Sealious = require("sealious");
var ResourceManager = Sealious.ResourceManager;

module.exports = {
	test_init: function() {
		var resource_type_email = new Sealious.ChipTypes.ResourceType({
			name: "email_resource",
			fields: [
				{name: "email", type: "email", required: true}
			]
		});
	},

	test_start: function() {
		describe("FieldType.Email", function() {
			it("should validate the email field successfully", function(done) {
				ResourceManager.create(new Sealious.Context(), "email_resource", {email: "test@test.com"})
				.then(function(ok){
					done();
				})
				.catch(function(error){
					done(error);
				})
			})
			it("should reject given email address (string)", function(done){
				ResourceManager.create(new Sealious.Context(), "email_resource", {email: "troll"})
				.then(function(ok){
					done(new Error("...but it decided the email address was correct"));
				})
				.catch(function(error){
					if (error.type === "validation")
						done();
					else
						done(new Error(error))
				})
			})
			it("should reject given email address (integer)", function(done){
				ResourceManager.create(new Sealious.Context(), "email_resource", {email: 1})
				.then(function(ok){
					done(new Error("...but it decided the email address was correct"));
				})
				.catch(function(error){
					if (error.type === "validation")					
						done();
					else
						done(new Error(error))
				})
			})
			it("should throw an error because of no value", function(done){
				ResourceManager.create(new Sealious.Context(), "email_resource", {})
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