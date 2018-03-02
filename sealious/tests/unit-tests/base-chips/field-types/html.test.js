"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_html = locreq("lib/app/base-chips/field-types/html.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");
const crypto = require("crypto");

describe("FieldType.html", function(){

	// test_is_proper_value({
    //     field_type: field_type_html,
    //     should_accept: [
    //         ["a basic text string", "hello"],
	// 		["Any html, actually: it should be pretty liberal (it's user input, after all)", "<h1>Hello!</h1>"],
	// 		["It should accept text that is of acceptable length according to params inherited from field_type_text", "<h1>abc</h1>", {max_length: 20}],
    //     ],
    //     should_reject: [
    //         ["An html string that's too long according to 'field_type_text' params", "<h1>Hello</h1>", {max_width: 1}],
    //     ]
    // });

	describe(".encode", function(){
		it("removes <script> tags", function(){
			const raw_html = "<script>alert(true)</script>Hello!";
			const encoded_value = field_type_html.encode(new Context(), {}, raw_html);
			assert.deepEqual(encoded_value, {
				original: raw_html,
				safe: "Hello!",
			});
		});

		it("removes onhover attributes", function(){
			const raw_html = '<h1 onhover="alert(true)">Hello!</h1>';
			const encoded_value = field_type_html.encode(new Context(), {}, raw_html);
			assert.deepEqual(encoded_value, {
				original: raw_html,
				safe: "<h1>Hello!</h1>",
			});
		});

	});

	describe(".format", function(){
		it("should return the safe version by default", function(){
			const result = field_type_html.format(new Context(), {}, {original: "a", safe: "b"});
			assert.equal(result, "b");
		});

		it("should return the original version when asked for 'unsafe' format", function(){
			const result = field_type_html.format(new Context(), {}, {original: "a", safe: "b"}, 'unsafe');
			assert.equal(result, "a");
		});

		it("should return the original version when asked for 'original' format", function(){
			const result = field_type_html.format(new Context(), {}, {original: "a", safe: "b"}, 'original');
			assert.equal(result, "a");
		});

	});

});
