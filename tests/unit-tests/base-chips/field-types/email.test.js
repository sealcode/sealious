"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_email = locreq("lib/app/base-chips/field-types/email.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");

describe("FieldType.Email", function(){

	test_is_proper_value({
        field_type: field_type_email,
        should_accept: [
            ["a properly formatted email address", "kuba@sealcode.org"],
			["an email with numbers in the username", "kuba123@sealcode.org"],
			["an email with all sorts of weird but allowed characters", "kuba-_123@sealcode.org"],
        ],
        should_reject: [
            ["a random string of text", "asofihas9efbaw837 asd"],
			["an incomplete email address", "kuba@sealcode"],
        ]
    });

	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_email.name, "email");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_email.get_description(), "string");
	});
});
