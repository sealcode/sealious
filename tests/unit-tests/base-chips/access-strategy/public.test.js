"use strict";
const locreq = require("locreq")(__dirname);
const assert = require("assert");
const public_as = locreq("lib/base-chips/access-strategy-types/public.js");

describe("AccessStrategy.Public", function() {
    it("returns the name of the access strategy", function() {
        assert.strictEqual(public_as.name, "public");
    });
    it("accepts everyone", function(done) {
        public_as.checker_function()
            .then(function() {
                done();
            })
            .catch(function(err){
                done(new Error(err));
            });
    });
    it("checks item_sensitive attribute", function() {
        assert.strictEqual(public_as.item_sensitive, false);
    });
});
