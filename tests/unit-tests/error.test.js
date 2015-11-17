var Sealious = require("sealious");

module.exports = {
	test_init: function() {

	},
	test_start: function() {
		describe("Sealious.Errors", function(){
			it("throws a Sealious.Errors.Error", function(done) {
				try{
					throw new Sealious.Errors.Error("This is just an error", {type: "test_error"});
				}
				catch (e) {
					if (e.type === "test_error")
						done();
					else 
						done(new Error("It didn't throw a Sealious Error"))
				}
			})
			it("throws a Sealious.Errors.ValidationError", function(done) {
				try{
					throw new Sealious.Errors.ValidationError("This is just an error");
				}
				catch (e) {
					if (e.type === "validation")
						done();
					else 
						done(new Error("It didn't throw a Sealious ValidationError"))
				}
			})
			it("throws a Sealious.Errors.ValueExists", function(done) {
				try{
					throw new Sealious.Errors.ValueExists("This is just an error");
				}
				catch (e) {
					if (e.type === "valueExists")
						done();
					else 
						done(new Error("It didn't throw a Sealious ValueExists Error"))
				}
			})
			it("throws a Sealious.Errors.InvalidCredentials", function(done) {
				try{
					throw new Sealious.Errors.InvalidCredentials("This is just an error");
				}
				catch (e) {
					if (e.type === "authorization")
						done();
					else 
						done(new Error("It didn't throw a Sealious InvalidCredentials Error"))
				}
			})
			it("throws a Sealious.Errors.NotFound", function(done) {
				try{
					throw new Sealious.Errors.NotFound("This is just an error");
				}
				catch (e) {
					if (e.type === "not_found")
						done();
					else 
						done(new Error("It didn't throw a Sealious NotFound Error"))
				}
			})
			it("throws a Sealious.Errors.InternalConnectionError", function(done) {
				try{
					throw new Sealious.Errors.InternalConnectionError("This is just an error");
				}
				catch (e) {
					if (e.type === "internal_connection_error")
						done();
					else 
						done(new Error("It didn't throw a Sealious InternalConnectionError Error"))
				}
			})
			it("throws a Sealious.Errors.DependencyError", function(done) {
				try{
					throw new Sealious.Errors.DependencyError("This is just an error");
				}
				catch (e) {
					if (e.type === "dependency_error")
						done();
					else 
						done(new Error("It didn't throw a Sealious DependencyError Error"))
				}
			})
			it("throws a Sealious.Errors.UnauthorizedRequest", function(done) {
				try{
					throw new Sealious.Errors.UnauthorizedRequest("This is just an error");
				}
				catch (e) {
					if (e.type === "unauthorized_request")
						done();
					else 
						done(new Error("It didn't throw a Sealious UnauthorizedRequest Error"))
				}
			})
			it("throws a Sealious.Errors.DeveloperError", function(done) {
				try{
					throw new Sealious.Errors.DeveloperError("This is just an error");
				}
				catch (e) {
					if (e.type === "dev_error")
						done();
					else 
						done(new Error("It didn't throw a Sealious DeveloperError"))
				}
			})
			it("throws a Sealious.Errors.BadContext", function(done) {
				try{
					throw new Sealious.Errors.BadContext("This is just an error");
				}
				catch (e) {
					if (e.type === "permission")
						done();
					else 
						done(new Error("It didn't throw a Sealious BadContext Error"))
				}
			})
		})
	}
}