const Context = require.main.require("lib/context.js");
const field_type_text = require.main.require("lib/base-chips/field-types/text.js");
const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");
const assert_no_error = require.main.require("tests/util/assert-no-error.js");

const assert = require("assert");

describe("FieldType.Text", function(){
	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_text.name, "text");
	});
	it("enables full text search", function() {
		assert.strictEqual(field_type_text.full_text_search_enabled({include_in_search: true}), true);
	});
	it("enables full text search with max length of 200", function() {
		assert.strictEqual(field_type_text.full_text_search_enabled({max_length: 201}), true);
	});
	it("disables full text search", function() {
		assert.strictEqual(field_type_text.full_text_search_enabled({}), false);
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_text.get_description(new Context(), {max_length: 10}), "string");
	});
	it("checks if is_proper_value works correctly", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_text.is_proper_value(accept, reject, new Context(), {}, 2);
	});
	it("checks if is_proper_value works correctly", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_text.is_proper_value(accept, reject, new Context(), {max_length: 5}, "12345");
	});
	it("checks if is_proper_value works correctly", function(done){
		const {accept, reject} = rejectCorrectly(done);
		field_type_text.is_proper_value(accept, reject, new Context(), {max_length: 5}, "asdfghjkl");
	});
	it("checks if is_proper_value accepts text with required min characters", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_text.is_proper_value(accept, reject, new Context(), {min_length: 4}, "aaaa");
	});
	it("checks if is_proper_value rejects text with fewer characters than needed", function(done) {
		const {accept, reject} = rejectCorrectly(done);
		field_type_text.is_proper_value(accept, reject, new Context(), {min_length: 4}, "aa");
	});
	it("checks if is_proper_value accepts text with required min and max characters", function(done) {
		const {accept, reject} = acceptCorrectly(done);
		field_type_text.is_proper_value(accept, reject, new Context(), {min_length: 2, max_length: 3}, "aaa");
	});
	it("checks if is_proper_value reject text that doesn't meet the requirements", function(done) {
		const {accept, reject} = rejectCorrectly(done);
		field_type_text.is_proper_value(accept, reject, new Context(), {min_length: 2, max_length: 3}, "aaaaaa");
	});
	it("checks if encode work properly (value_in_code is a string)", function(done) {
		field_type_text.encode(new Context, {}, "<a>string</a>")
			.then(function(result) {
				console.log(result);
				assert.strictEqual(result.original, "<a>string</a>");
				assert.strictEqual(result.safe, "&lt;a&gt;string&lt;/a&gt;");
				assert.strictEqual(result.valueOf(), "<a>string</a>");
				done();
			})
			.catch(function(err) {
				done(new Error(err));
			});
	});
	it("checks if encode works properly (sanitizes html)", function(done) {
		field_type_text.encode(new Context(), {}, "outside<script>alert(\"a\")</script>")
		.then(function(result) {
			assert.strictEqual(result.safe, "outside&lt;script&gt;alert(&quot;a&quot;)&lt;/script&gt;");
			done();
		})
		.catch(function(error) {
			done(new Error(error));
		})
	});
	it("resolved with null when value_in_code is null", function(done) {
		field_type_text.encode(new Context(), {}, null)
		.then(function(result) {
			assert.strictEqual(result, null);
			done();
		})
		.catch(function(error) {
			done(new Error(error));
		})
	})
	it("checks if encode works properly", function(done) {
		field_type_text.encode(new Context(), {}, {})
		.then(function(result) {
			done();
		})
		.catch(function(error) {
			done(new Error(error));
		})
	});
});
