var Sealious = require("sealious");

module.exports = {
	test_init: function() {

	},
	test_start: function() {
		var field_type_hashed_text = Sealious.ChipManager.get_chip("field_type", "hashed-text");
		describe("FieldType.Password", function() {
			it("resolved with a hash", function(done) {
				field_type_hashed_text.encode(new Sealious.Context(), {}, "test")
				.then(function(result){
					if (result === "937851b9666b7c662e66ad01dec52c6c365c5d89cfae45abb34c2c825cff193113768c613c8af9353f47b1a729719e56f45ec8c8058487871cc611a78a5157c8")
						done();
					else
						done(new Error("Wrong hash"));
				})
				.catch(function(error){
					done(new Error(error))
				})
			})
		})
	}
}