const Responses = require.main.require("lib/response/responses.js");
const assert = require("assert");

describe("Sealious.Responses", function() {
    it("returns a new Responses.NewSession object", function() {
        const newSession = new Responses.NewSession("my_id");
        assert.strictEqual(newSession.status, "success");
        assert.strictEqual(newSession.message, "Logged in!");
        assert.deepEqual(newSession.data, {});
    });
});
