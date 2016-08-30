"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_file = locreq("lib/base-chips/field-types/file.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const File = locreq("lib/data-structures/file.js");

const assert = require("assert");

describe("FieldType.File", function(){

	test_is_proper_value({
        field_type: field_type_file,
        should_accept: [
            ["a File instance", new File()],
			["an object with filename and data attributes", {
				filename: "test_filename",
				data: new Buffer(1)
			}],
			["a proper URL to a downloadable file", "http://example.com"],
        ],
        should_reject: [
            ["a random string of text", "asofihas9efbaw837 asd"],
            ["an empty objec", {}],
			["an object with 'filename', but without 'data'", {filename: "picture.jpg"}],
			["a malformed http url", "htpp://example.com"],
			["a properly formed, but non-existing http url", "http://www.da3bba42e1f6d77a63bd665d0a82ff32.org"],
        ]
    });

	it("checks if encode works correctly (value_in_code is false)", function(){
		assert.strictEqual(field_type_file.encode(new Context(), {}, false), null);
	});
	it("checks if decode works correctly (value_in_database is false, params.no_file_value is not given)", function(){
		assert.strictEqual(field_type_file.decode(new Context(), {}, false), undefined);
	});
	it("checks if decode works correctly (value_in_database is false, params.no_file_value is given)", function(){
		assert.strictEqual(field_type_file.decode(new Context(), {no_file_value: "test"}, false), "test");
	});
});
