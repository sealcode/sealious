var Sealious = require("sealious");

module.exports = {
	test_init: function() {

	},
	test_start: function() {
		var field_type_password = Sealious.ChipManager.get_chip("field_type", "password");
		describe("FieldType.Password", function() {
			it("resolved with a hash", function(done) {
				field_type_password.encode(new Sealious.Context(), {}, "test")
				.then(function(result) {
					console.log(result);
				})

				
			})
		})
	}
}