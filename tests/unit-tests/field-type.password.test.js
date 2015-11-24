var Sealious = require("sealious");

module.exports = {
	test_init: function() {

	},
	test_start: function() {
		var field_type_password = Sealious.ChipManager.get_chip("field_type", "password");
		describe("FieldType.Password", function() {
			it("resolved with a hash", function(done) {
				field_type_password.encode(new Sealious.Context(), {}, "test")
				.then(function(result){
					if (result === "098f6bcd4621d373cade4e832627b4f6") {
						done();
					} else {
						done("Wrong hash");
					}
				})
				.catch(function(error){
					done(new Error(result))
				})
			})
		})
	}
}