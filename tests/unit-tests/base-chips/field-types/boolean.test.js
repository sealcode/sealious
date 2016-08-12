"use strict";
const locreq = require("locreq")(__dirname);
const field_type_boolean = locreq("lib/base-chips/field-types/boolean.js");
const Context = locreq("lib/context.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");


describe("FieldType.Boolean", function(){

	test_is_proper_value({
		field_type: field_type_boolean,
		should_accept: [
			["integer", 1],
			["integer", 0],
			["boolean", true],
			["boolean", false],
			["string", "true"],
			["string", "True"],
			["string", "false"],
			["string", "False"],
		],
		should_reject: [
			["random string of text", "o87at gfoi4sg6npw98sh"],
		]
	});


	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_boolean.name, "boolean");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_boolean.get_description(), "string");
	});

	describe(".encode", function(){
		it("encodes the value correctly (given boolean)", function(){
			assert.strictEqual(field_type_boolean.encode(new Context(), {}, true), true);
		});
		it("encodes the value correctly (given 1)", function(){
			assert.strictEqual(field_type_boolean.encode(new Context(), {}, 1), true);
		});
		it("encodes the value correctly (given 0)", function(){
			assert.strictEqual(field_type_boolean.encode(new Context(), {}, 0), false);
		});
		it("encodes the value correctly (given \"false\")", function(){
			assert.strictEqual(field_type_boolean.encode(new Context(), {}, "false"), false);
		});
		it("encodes the value correctly (given \"true\")", function(){
			assert.strictEqual(field_type_boolean.encode(new Context(), {}, "true"), true);
		});
		it("encodes the value correctly (given \"true\")", function(){
			assert.strictEqual(field_type_boolean.encode(new Context(), {}, "true"), true);
		});
	})
	it("doesn't encode the value (given 5)", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, 5), undefined);
	});
	it("filters to query when filter is an empty string", function(){
		assert.deepEqual(field_type_boolean.filter_to_query(new Context(), {}, ""), {$in: [true, false]});
	});
	it("filters to query when filter is null", function(){
		assert.deepEqual(field_type_boolean.filter_to_query(new Context(), {}, null), {$in: [true, false]});
	});
	it("filters by encoding the value \"true\"", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, "true"), true);
	});
	it("filters by encoding the value \"false\"", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, "false"), false);
	});
	it("filters by encoding the value \"1\"", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, "1"), true);
	});
	it("filters by encoding the value \"0\"", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, "0"), false);
	});
	it("filters by encoding the value 0", function(){
		assert.strictEqual(field_type_boolean.filter_to_query(new Context, {}, 0), false);
	});
});
