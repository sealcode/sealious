"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_datetime = locreq("lib/base-chips/field-types/datetime.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");

describe("FieldType.Datetime", function(){

    test_is_proper_value({
        field_type: field_type_datetime,
        should_accept: [
            ["a proper timestamp", Date.now()],
            ["a timestamp in a string", Date.now().toString()]
        ],
        should_reject: [
            ["a random string of text", "asofihas9efbaw837 asd"],
			["a date in YYYY-MM-DD format", "2016-08-12"]
        ]
    });

    it("returns the name of the field type", function() {
        assert.strictEqual(field_type_datetime.name, "datetime");
    });
    it("returns the description of the field type", function(){
        assert.strictEqual(typeof field_type_datetime.get_description(), "string");
    });
    it("checks if encode works properly (given \"1\")", function(){
        assert.strictEqual(field_type_datetime.encode(new Context(), {}, "1"), 1);
    });
});
