"use strict";

const locreq = require("locreq")(__dirname);
const assert = require("assert");
const Logger = locreq("lib/logger/logger.js");
const ConfigManager = locreq("lib/config/config-manager.js");

describe("Sealious.Logger", function(){
    it("gets default config of Logger", function(){
        const config = ConfigManager.get_config().logger;
        assert.strictEqual(config.level, "info");
        assert.strictEqual(config.color, true);
        assert.strictEqual(config.file, null);
        assert.strictEqual(config.dirname, ".");
        assert.strictEqual(config.to_json, false);
        assert.strictEqual(config.rotation, ".yyyy-MM-Tdd");
    });
    it("checks if levels are correct", function(){
        assert.strictEqual(Logger.levels.lazyseal, 0);
        assert.strictEqual(Logger.levels.info, 1);
        assert.strictEqual(Logger.levels.debug, 2);
        assert.strictEqual(Logger.levels.warning, 3);
        assert.strictEqual(Logger.levels.error, 4);
        assert.strictEqual(Logger.levels.no_output, 5);
    });
});
