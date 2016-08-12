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

	it("sets such a config that Object.assign will not parse it correctly", function(){
		ConfigManager.set_default_config(
			"test.config2", {
				foo: {
					bar: "baz",
					bat: "bax"
				}
			}
		);
		ConfigManager.set_config(
			"test.config2", {
				foo: {
					bam: "bak"
				}
			}
		);
		const config = ConfigManager.get_config("test.config2");
		assert.deepEqual(config, { foo: { bar: "baz", bat: "bax", bam: "bak" } });
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
});
