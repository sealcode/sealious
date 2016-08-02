const Context = require.main.require("lib/context.js");
const assert = require("assert");

describe("Sealious.Context", function() {
    it("returns an Context instance properly (no arguments provided)", function() {
        const context = new Context();
        assert.strictEqual(context.ip, null);
        assert.strictEqual(context.user_id, null);
        assert(new Date().getTime() - context.timestamp <= 1);
        assert.strictEqual(context._cached_user_data, false);
        assert.strictEqual(context.loading_user_data, false);
    });
    it("returns an Context instance proreply (with arguments)", function() {
        const context = new Context(1, "ip", "user_id", "session_id");
        assert.strictEqual(context.timestamp, 1);
        assert.strictEqual(context.ip, "ip");
        assert.strictEqual(context.user_id, "user_id");
        assert.strictEqual(context.session_id, "session_id");
    });
    it("checks if session_id is non-writable", function() {
        const context = new Context(1, "ip", "user_id", "session_id");
        context.session_id = 2;
        assert.strictEqual(context.session_id, "session_id");
    });
    it("checks if _cached_user_data and loading_user_data are not enumerable", function() {
        const context = new Context();
        assert.strictEqual(Object.keys(context).length, 3);
    });
});
