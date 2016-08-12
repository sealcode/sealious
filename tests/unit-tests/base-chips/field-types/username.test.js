"use strict";
const locreq = require("locreq")(__dirname);

const Context = locreq("lib/context.js");
const field_type_username = locreq("lib/base-chips/field-types/username.js");
const acceptCorrectly = locreq("tests/util/accept-correctly.js");
const rejectCorrectly = locreq("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Username", function(){
	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_username.name, "username");
	});
    it("returns the name of the field type it extends", function(){
        assert.strictEqual(field_type_username.extends, "text");
    });
});
