"use strict";
const locreq = require("locreq")(__dirname);
const assert = require("assert");
const public = locreq("lib/base-chips/access-strategy-types/public.js");

describe("AccessStrategy.Public", function() {
    it("returns the name of the access strategy", function() {
        assert.strictEqual(public.name, "public");
    });
    it("accepts everyone", function(done) {
        public.checker_function()
            .then(function() {
                done();
            })
            .catch(function(err){
                done(new Error(err));
            });
    });
    it("checks item_sensitive attribute", function() {
        assert.strictEqual(public.item_sensitive, false);
    });
});
