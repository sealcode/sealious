"use strict";
const locreq = require("locreq")(__dirname);
const assert = require("assert");
const noone = locreq("lib/app/base-chips/access-strategy-types/noone.js");

describe("AccessStrategy.Noone", function() {
    it("returns the name of the access strategy", function(){
        assert.strictEqual(noone.name, "noone");
    });
    it("rejects the checker_function", function(done) {
        noone.checker_function()
            .then(function() {
                done(new Error("It didn't reject!"));
            })
            .catch(function(err) {
                assert.notStrictEqual(err.indexOf("Noone gets in!"), -1);
                done();
            });
    });
    it("checks item_sensitive atribute", function() {
        assert.strictEqual(noone.item_sensitive, false);
    });
});
