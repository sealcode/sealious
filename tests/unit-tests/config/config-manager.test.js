"use strict";
const locreq = require("locreq")(__dirname);
const ConfigManager = locreq("lib/config/config-manager.js");
const assert = require("assert");

describe("ConfigManager", function(){

	it("sets a new config and then gets it", function(){
		ConfigManager.set_config(
			"test.config", {
				"test_key_object": {
					"my_key": "my_value"
				}
			}
		);
		const config = ConfigManager.get_config("test.config");
		assert.deepEqual(config, { test_key_object: { my_key: "my_value" }});
	});

	it("sets a default config, modifies it and then gets it", function(){
		ConfigManager.set_default_config(
			"test.config", {
				"test_key_object": {
					"my_key": "my_value"
				}
			}
		);
		ConfigManager.set_config(
			"test.config", {
				"test_key_object2": {
					"my_key2": "my_value2"
				}
			}
		);
		const config = ConfigManager.get_config("test.config");
		assert.deepEqual(config, { test_key_object: { my_key: "my_value" }, test_key_object2: { my_key2: "my_value2" } });
	});

	it("gets configuration", function(){
		const config = ConfigManager.get_configuration("this.key");
		assert.strictEqual(config instanceof Object, true);
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
});
