"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const Promise = require("bluebird");

const field_type_single_reference_fn = locreq("lib/app/base-chips/field-types/single_reference.js");
const app = {};
const field_type_single_reference = field_type_single_reference_fn(app);

const assert = require("assert");
const assert_error_type = locreq("tests/util/assert-error-type.js");
const Errors = locreq("lib/response/error.js");
const Collection = locreq("lib/chip-types/collection.js");

describe("FieldType.single_reference", function(){

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
			);
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
