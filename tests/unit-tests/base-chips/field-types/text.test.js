"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_text = locreq("lib/base-chips/field-types/text.js");
const assert_no_error = locreq("tests/util/assert-no-error.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");

describe("FieldType.Text", function(){

	test_is_proper_value({
        field_type: field_type_text,
        should_accept: [
            ["a string of text", "hello"],
			["a string of text shorter than max_length", "hello", {max_length: 10}],
			["a string of text longer than min_length", "hello", {min_length: 2}],
			["a string of text longer than min_length and shorter than max_length", "abc", {min_length: 2, max_length: 4}],
        ],
        should_reject: [
            ["a text that's too long", "hamster, a dentist", {max_length: 5}],
			["a string of text shorter than min_length", "h", {min_length: 2}],
			["a string of text shorter than max, but too short", "ab", {min_length: 3, max_length: 5}],
        ]
    });

	describe(".has_index", function(){

		it("returns false if 'params.full_text_search' is not set", function(){
			assert.strictEqual(field_type_text.has_index({}), false);
		});

		it("returns false if 'params.full_text_search' is set to 'false'", function(){
			assert.strictEqual(field_type_text.has_index({full_text_search: false}), false);
		});

		it("returns 'text' if 'params.full_text_search' is set to 'false'", function(){
			assert.strictEqual(field_type_text.has_index({full_text_search: true}), "text");
		});

	});

	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_text.name, "text");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_text.get_description(new Context(), {max_length: 10}), "string");
	});
	it("checks if encode work properly (value_in_code is a string)", function(done){
		field_type_text.encode(new Context, {}, "<a>string</a>")
			.then(function(result){
				assert.strictEqual(result.original, "<a>string</a>");
				assert.strictEqual(result.safe, "&lt;a&gt;string&lt;/a&gt;");
				assert.strictEqual(result.valueOf(), "<a>string</a>");
				done();
			})
			.catch(function(err){
				done(new Error(err));
			});
	});
	it("checks if encode works properly (sanitizes html)", function(done){
		field_type_text.encode(new Context(), {}, "outside<script>alert(\"a\")</script>")
		.then(function(result){
			assert.strictEqual(result.safe, "outside&lt;script&gt;alert(&quot;a&quot;)&lt;/script&gt;");
			done();
		})
		.catch(function(error){
			done(new Error(error));
		});
	});
	it("resolved with null when value_in_code is null", function(done){
		field_type_text.encode(new Context(), {}, null)
		.then(function(result){
			assert.strictEqual(result, null);
			done();
		})
		.catch(function(error){
			done(new Error(error));
		});
	});
	it("checks if encode works properly", function(done){
		field_type_text.encode(new Context(), {}, {})
		.then(function(){
			done();
		})
		.catch(function(error){
			done(new Error(error));
		});
	});
});
