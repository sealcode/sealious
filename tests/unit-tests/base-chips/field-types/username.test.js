"use strict";
const locreq = require("locreq")(__dirname);

const Context = locreq("lib/context.js");
const field_type_username = locreq("lib/base-chips/field-types/username.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");

describe("FieldType.Username", function(){

	test_is_proper_value({
		field_type: field_type_username,
		should_accept: [
			["the same value as in old_value", "username", {}, "username"],
		],
		should_reject: [
			["a reserced keyword", "me"],
		]
	});

	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_username.name, "username");
	});
    it("returns the name of the field type it extends", function(){
        assert.strictEqual(field_type_username.extends, "text");
    });
});
