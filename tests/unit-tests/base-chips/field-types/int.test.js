"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_int = locreq("lib/app/base-chips/field-types/int.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");

describe("FieldType.Int", function(){

	test_is_proper_value({
        field_type: field_type_int,
        should_accept: [
            ["a positive integer", 1],
			["a negative integer", -1],
			["a zero", 0],
        ],
        should_reject: [
            ["a random string of text", "asofihas9efbaw837 asd"],
			["a number with decimals", 2.5],
        ]
    });

	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_int.name, "int");
	});
	it("should return the description of the field type", function(){
		assert.strictEqual(typeof field_type_int.get_description(), "string");
	});
	it("should check if encode works properly (given \"2\")", function(){
		assert.strictEqual(field_type_int.encode(new Context(), {}, "2"), 2);
	});

	describe(".filter_to_query", function(){
		it("returns {$eq: value} if field_filter is a Number", function(){
			const result = field_type_int.filter_to_query(
				new Context(),
				{},
				3
			);
			assert.deepEqual(result, {$eq: 3});
		});

		it("returns {$eq: value} if field_filter is a Number-like string", function(){
			const result = field_type_int.filter_to_query(
				new Context(),
				{},
				"3"
			);
			assert.deepEqual(result, {$eq: 3});
		});

		it("returns {$eq: value} if field_filter is {'=': value}", function(){
			const result = field_type_int.filter_to_query(
				new Context(),
				{},
				{"=": "3"}
			);
			assert.deepEqual(result, {$eq: 3});
		});

		it("returns {$lt: value} if field_filter is {'<': value}", function(){
			const result = field_type_int.filter_to_query(
				new Context(),
				{},
				{"<": "3"}
			);
			assert.deepEqual(result, {$lt: 3});
		});

		it("throws an error if given an unknown comparator", function(){
			try{
				const result = field_type_int.filter_to_query(
					new Context(),
					{},
					{"~": "3"}
				);
			}catch(error){
				assert.equal(error.type, "validation");
				return;
			}
			throw new Error("It didn't throw an error");
		});

	});
});
