"use strict";
const locreq = require("locreq")(__dirname);
const ConfigManager = locreq("lib/app/config-manager.js");
const assert = require("assert");

describe("ConfigManager", function(){

	describe(".pure", function(){
		describe(".set_config", function(){
			it("handles nested data", function(){
				const default_config = {a: "A"};
				const config = {b: {c: "D"}};
				const change = ConfigManager.pure.set_config(
					default_config,
					config,
					"b.c",
					{e: "f"}
				);
				assert.deepEqual(
					change,
					[default_config, {b: {c: {e: "f"}}}]
				);
			});
		});
	});

});
