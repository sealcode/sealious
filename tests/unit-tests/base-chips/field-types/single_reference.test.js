"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_single_reference = locreq("lib/base-chips/field-types/single_reference.js");
const assert = require("assert");

describe("FieldType.Username", function(){
	describe(".encode", function(){
		it("should return the value unchanged if it is a string", function(){
			let result = field_type_single_reference.encode(
				new Context(),
				{},
				"randomid"
			);
			assert.equal(result, "randomid");
		});

		it("should return the .id attribute if given value is an object", function(){
			let result = field_type_single_reference.encode(
				new Context(),
				{},
				{id: "randomid"}
			);
			assert.equal(result, "randomid");
		});
	});

	describe(".format", function(){
		it("should return the decoded value unchanged if no format params are provided", function(){
			let result = field_type_single_reference.format(
				new Context(),
				undefined,
				"randomid"
			)
			assert.equal(result, "randomid");
		});
	});

	describe(".filter_to_query", function(){
		it("should return the value (supposed to be a resource_id wrapped in {$eq: ''}", function(){
			let result = field_type_single_reference.filter_to_query(
				new Context(),
				{},
				"randomid"
			);
			assert.deepEqual(result, {$eq: "randomid"});
		});
	});
});
