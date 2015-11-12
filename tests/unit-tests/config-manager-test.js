var Sealious = require("sealious");

module.exports = {
	test_init: function() {

	},
	test_start: function() {
		describe("ConfigManager", function() {
			it("sets config with arguments.length === 1", function(done) {
				Sealious.ConfigManager.set_config("some_key");
				done();
			})
			it("sets config with arguments.length === 2 and uses modify_config private function", function(done) {
				Sealious.ConfigManager.set_config("this.key", "config");
				done();
			})
			it("sets default config with arguments.length === 1", function(done) {
				Sealious.ConfigManager.set_default_config("some_key");
				done();
			})
			it("gets configuration", function(done) {
				var config = Sealious.ConfigManager.get_configuration("this.key");
				if (config instanceof Object)
					done();
				else 
					done(new Error("It didn't return an object"))
			})
		})
	}
}