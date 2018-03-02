"use strict";
const locreq = require("locreq")(__dirname);
const assert = require("assert");
const FieldTypeDefaultMethods = locreq("lib/chip-types/field-type-default-methods.js");

describe("Sealious.FieldTypeDefaultMethods", function() {
    it("resolves the .is_proper_value()", function(done) {
        FieldTypeDefaultMethods.is_proper_value()
        .then(function() {
            done();
        }).catch(done);
    });
    it("resolves the .format() with decoded value \"test\"", function() {
        assert.strictEqual(FieldTypeDefaultMethods.format(null, null, "test"), "test");
    });
    it("resolves the .format() with decoded value null", function() {
        assert.strictEqual(FieldTypeDefaultMethods.format(null, null, null), null);
    });
    it("resolves the .encode() with value \"test\"", function() {
        assert.strictEqual(FieldTypeDefaultMethods.encode(null, null, "test"), "test");
    });
    it("resolves the .encode() with value null", function() {
        assert.strictEqual(FieldTypeDefaultMethods.encode(null, null, null), null);
    });
    it("returns the .decode() with value \"test\"", function() {
        assert.strictEqual(FieldTypeDefaultMethods.decode(null, null, "test"), "test");
    });
    it("returns the .decode() with value null", function() {
        assert.strictEqual(FieldTypeDefaultMethods.decode(null, null, null), null);
    });
    it("resolves the .filter_to_query() with value \"test\"", function(done) {
        FieldTypeDefaultMethods.filter_to_query(null, null, "test")
        .then(function(encoded) {
            assert.deepEqual(encoded, {$eq: "test"});
            done();
        }).catch(done);
    });
    it("returns false when full_text_search_enabled called", function() {
        assert.strictEqual(FieldTypeDefaultMethods.full_text_search_enabled(), false);
    });
    it("returns the field type description", function() {
        FieldTypeDefaultMethods.name = "test_name";
        const field_type = FieldTypeDefaultMethods.get_description();
        assert.strictEqual(field_type.summary, "test_name");
        assert.strictEqual(field_type.raw_params, undefined);
        assert.deepEqual(field_type.extra_info, {});
    });
});
