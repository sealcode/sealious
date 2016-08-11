"use strict";
const locreq = require("locreq")(__dirname);
const ConfigManager = locreq("lib/config/config-manager.js");
const assert = require("assert");

describe("ConfigManager", function(){

	it("sets config with arguments.length === 1", function(){
		assert.doesNotThrow(function() {
			ConfigManager.set_config("some_key");
		});
	});

	it("sets config with arguments.length === 2 and uses modify_config private function", function(){
		assert.doesNotThrow(function() {
			ConfigManager.set_config("this.key", "config");
		});
	});

	it("sets default config with arguments.length === 1", function(){
		assert.doesNotThrow(function() {
			ConfigManager.set_default_config("some_key");
		});
	});

	it("gets configuration", function(){
		ConfigManager.set_default_config(
			"test_config", {
				test_field: "test_value",
				is_test: true,
			});
		const config = ConfigManager.get_config().test_config;
		assert.strictEqual(config.test_field, "test_value");
		assert.strictEqual(config.is_test, true);
	});

	it("gets dispatcher config", function(){
		const dispatcher_config = ConfigManager.get_dispatcher_config();
		assert.strictEqual(dispatcher_config instanceof Object, true);
		assert.strictEqual(Object.getOwnPropertyNames(dispatcher_config).length, 0);
	});

	it("gets non existent chip config and returns undefined", function(){
		const dispatcher_config = ConfigManager.get_chip_config("some_non_existent_longid");
		assert.strictEqual(dispatcher_config, undefined);
	});
})
