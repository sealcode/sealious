"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_float = locreq("lib/app/base-chips/field-types/float.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");

describe("FieldType.Float", function(){

	test_is_proper_value({
        field_type: field_type_float,
        should_accept: [
            ["a normal float number", Math.PI],
			["a 0", 0],
			["a negative integer", -1],
			["a negative float", -1.5],
        ],
        should_reject: [
            ["a random string of text", "asofihas9efbaw837 asd"],
			["an improperly formatted float number", "2.123123.12312"],
        ]
    });


	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_float.name, "float");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_float.get_description(), "string");
	});
	it("checks if encode works properly (given \"2\")", function(){
		assert.strictEqual(field_type_float.encode(new Context(), {}, "2.5"), 2.5);
	});
});
