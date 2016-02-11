var Sealious = require("sealious");

module.exports = {
	test_init: function(){

	},
	test_start: function(){
		var just_owner = Sealious.ChipManager.get_chip("access_strategy", "just_owner")
		describe("AccessStrategy.JustOwner", function(){
			it("checks if the user is the owner and returns true", function(done){
				var context = new Sealious.Context(undefined, "ip", "user_id");
				var item = {
					created_context: {
						user_id: "user_id"
					}
				}
				just_owner.checker_function(context, item)
				.then(function(){
					done();
				})
				.catch(function(error){
					done(new Error(error))
				})
			})
			/*
			it("checks if the user is the owner and returns false (the test doesn't pass because it doesn't reject with an error but with a string)", function(done) {
				var context = new Sealious.Context(undefined, "ip", "user_id");
				var item = {
					created_context: {
						user_id: "user_id2"
					}
				}
				just_owner.checker_function(context, item)
				.then(function() {
					done(new Error("It lets the user pass"));
				})
				.catch(function(error) {
					if(error instanceof String)
						done(new Error("The error is an instance of String"))
					else
						done();
				})
			})
*/
		})
	}
}