const assert = require("assert");
const Promise = require("bluebird");

const Single = require.main.require("lib/chip-types/field-structures/single.js");
const HashedText = require.main.require("lib/base-chips/field-types/hashed-text.js");
HashedText.params = {};

describe("Sealious.FieldStructures.Single", function() {
    it("properly returns .encode() value of another field", function(done){
        const promises = [
            HashedText.encode(null, {}, "test"),
            Single.encode(null, HashedText, "test")
        ];
        Promise.all(promises)
            .then(function(result) {
                assert.strictEqual(result[0], result[1]);
                done();
            }).catch(done);
    });
    it("properly returns .decode() value of another field", function() {
        assert.strictEqual(Single.decode(null, HashedText, "test"), "test");
    });
});
