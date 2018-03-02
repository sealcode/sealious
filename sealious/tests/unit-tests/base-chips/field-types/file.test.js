"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const File = locreq("lib/data-structures/file.js");

const assert = require("assert");

const field_type_file_fn = locreq("lib/app/base-chips/field-types/file.js");
const app = {};

const field_type_file = field_type_file_fn(app);

describe("FieldType.File", function(){

	test_is_proper_value({
        field_type: field_type_file_fn(app),
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

	describe("encode", function(){
		it("returns 'null' if 'value_in_code' is false", function(){
			assert.strictEqual(field_type_file.encode(new Context(), {}, false), null);
		});
	});

	describe("decode", function(){
		it("returns undefined if value_in_database and params.no_file_value is not set", function(){
			assert.strictEqual(field_type_file.decode(new Context(), {}, false), undefined);
		});

		it("return 'params.no_file_value' if value_in_db is false", function(){
			assert.strictEqual(field_type_file.decode(new Context(), {no_file_value: "test"}, false), "test");
		});
	});
});
