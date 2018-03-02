"use strict";
const locreq = require("locreq")(__dirname);
const field_type_context = locreq("lib/app/base-chips/field-types/context.js");
const Context = locreq("lib/context.js");

const assert = require("assert");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

describe("FieldType.Context", function(){

    test_is_proper_value({
        field_type: field_type_context,
        should_accept: [
            ["a Context instance", new Context()],
        ],
        should_reject: [
            ["a random string of text", "asofihas9efbaw837 asd"],
            ["an object that is not a Context instance", {user_id: null}]
        ]
    });

    it("returns the name of the field type", function(){
        assert.strictEqual(field_type_context.name, "context");
    });

});
