var Sealious = require('sealious');

module.exports = {
	test_init: function() {
		new Sealious.ChipTypes.AccessStrategy({
			name: "test_access_strategy",
			checker_function: function(context){
				return Promise.resolves();
			},
			item_sensitive: false,
		});
	},
	test_start: function() {
		describe("AccessStrategy", function() {
			it("throws an error because declaration.name isn't string", function(done) {
				try {
					new Sealious.ChipTypes.AccessStrategy({})
				}
				catch (e) {
					if (e.type === "dev_error")
						done();
					else
						done(new Error("It didn't throw a developer error"))
				}
			})
			it("finds tests_access_strategy", function(done) {
				var result = Sealious.ChipManager.get_chip("access_strategy", "test_access_strategy")
				if (result.name === "test_access_strategy")
					done();
				else
					done("The names don't match");
			})
		})
	}
}