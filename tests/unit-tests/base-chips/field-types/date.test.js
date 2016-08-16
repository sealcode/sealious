"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_date = locreq("lib/base-chips/field-types/date.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");

describe("FieldType.Date", function(){

	test_is_proper_value({
        field_type: field_type_date,
        should_accept: [
            ["a proper YYYY-MM-DD date", "2016-08-12"],
        ],
        should_reject: [
            ["a random string of text", "asofihas9efbaw837 asd"],
			["an integer value", Date.now()]
        ]
    });

	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_date.name, "date");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_date.get_description(), "string");
	});
});
