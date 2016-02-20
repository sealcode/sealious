var Sealious = require('sealious');

var assert_no_error = require("../util/assert-no-error.js");
var assert_error_type = require("../util/assert-error-type.js");

module.exports = {
	test_init: function(){
	},
	test_start: function(){
		describe("UserManager", function(){
			it("creates a new user", function(done){
				Sealious.UserManager.create_user(new Sealious.Context(), "user", "pass")
				.then(function(result){
					if (result.body.username === "user" && result.body.password === "pass") {
						done();
					} else {
						done(new Error("It created wrong user"))
					}
				})
				.catch(function(error){
					done(new Error(error))
				})
			})
			it("should not create a user that already exists", function(done){
				var context = new Sealious.Context()
				Sealious.UserManager.create_user(context, "user_exists", "pass_exists")
				.then(function(result){
					var result = Sealious.UserManager.create_user(context, "user_exists", "pass_exists");
					assert_error_type(result, "valueExists", done);
				})
				.catch(function(error){
					done(new Error(error))
				});
			});
			it("gets all users", function(done){
				Sealious.UserManager.get_all_users(new Sealious.Context)
				.then(function(result){
					if (typeof result === "object"){
						if (result.length >= 2) {
							done();
						} else {
							done(new Error("It didn't return enough elements"));
						}
					} else {
						done(new Error("It didn't return an array with users"));
					}
				})
				.catch(function(error){
					done(new Error(error));
				})
			})
			it("matched given credentials", function(done){
				var result = Sealious.UserManager.password_match(new Sealious.Context(), "user_exists", "pass_exists");
				assert_no_error(result, done);
			});
			it("didn't match given credentials", function(done){
				Sealious.UserManager.password_match(new Sealious.Context(), "blablagarbage", "blablagarbage")
				.then(function(result){
					done("It found the user");
				})
				.catch(function(error){
					if (error.type === "authorization") {
						done();
					} else {
						done(new Error(error));
					}
				})
			})
			it("misses username and password", function(done){
				Sealious.UserManager.password_match(new Sealious.Context)
				.then(function(result){
					done("It worked");
				})
				.catch(function(error){
					if (error.type === "authorization"){
						done();
					} else {
						done(new Error(error));
					}
				})
			})
			it("misses username and password", function(done){
				Sealious.UserManager.password_match(new Sealious.Context, "username")
				.then(function(result){
					done("It worked");
				})
				.catch(function(error){
					if (error.type === "authorization"){
						done();
					} else {
						done(new Error(error));
					}
				})
			})
		});
	}
};
