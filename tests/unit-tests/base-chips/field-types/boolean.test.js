const field_type_boolean = require.main.require("lib/base-chips/field-types/boolean.js");
const Context = require.main.require("lib/context.js");

const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");

const assert = require("assert");


describe("FieldType.Boolean", function(){
	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_boolean.name, "boolean");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_boolean.get_description(), "string");
	});
	it("checks if is_proper_value works correctly (given boolean)", function(done){
        const {accept, reject} = acceptCorrectly(done);
		field_type_boolean.is_proper_value(accept, reject, new Context(), {}, true);
	});
	it("checks if is_proper_value works correctly (given 1)", function(done){
        const {accept, reject} = acceptCorrectly(done);
        field_type_boolean.is_proper_value(accept, reject, new Context(), {}, 1);
	});
	it("checks if is_proper_value works correctly (given \"true\")", function(done){
        const {accept, reject} = acceptCorrectly(done);
        field_type_boolean.is_proper_value(accept, reject, new Context(), {}, "true");
	});
	it("checks if is_proper_value works correctly (given 2)", function(done){
        const {accept, reject} = rejectCorrectly(done);
        field_type_boolean.is_proper_value(accept, reject, new Context(), {}, 2);
	});
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
});
