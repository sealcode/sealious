var Sealious = require("sealious");

module.exports = {
	test_init: function(){

	},
	test_start: function(){
		describe("ConfigManager", function(){
			it("sets config with arguments.length === 1", function(done){
				try {
					Sealious.ConfigManager.set_config("some_key");
					done();
				}
				catch (e) {
					done(new Error(e));
				}
			})
			it("sets config with arguments.length === 2 and uses modify_config private function", function(done){
				try {
					Sealious.ConfigManager.set_config("this.key", "config");
					done();
				}
				catch (e) {
					done(new Error(e));
				}
			})
			it("sets default config with arguments.length === 1", function(done){
				try {
					Sealious.ConfigManager.set_default_config("some_key");
					done();
				}
				catch (e) {
					done(new Error(e));
				}
			})
			it("gets configuration", function(done){
				var config = Sealious.ConfigManager.get_configuration("this.key");
				if (config instanceof Object)
					done();
				else 
					done(new Error("It didn't return an object"))
			})
			it("gets dispatcher config", function(done){
				var dispatcher_config = Sealious.ConfigManager.get_dispatcher_config();
				if (dispatcher_config instanceof Object)
					if (Object.getOwnPropertyNames(dispatcher_config).length === 0)
						done();
				else
					done(new Error("It didn't return an empty object"))
				else
					done(new Error("It didn't return an object"))
			})
			it("gets non existent chip config and returns undefined", function(done){
				var dispatcher_config = Sealious.ConfigManager.get_chip_config("some_non_existent_longid");
				if (dispatcher_config === undefined)
					done();
				else 
					done(new Error("It didn't return undefined"))
			})
		})
	}
}