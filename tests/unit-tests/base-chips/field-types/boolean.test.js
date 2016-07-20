const Context = require.main.require("lib/context.js");
const assert_no_error = require.main.require("tests/util/assert-no-error.js");
const assert_error = require.main.require("tests/util/assert-error.js");
const assert = require("assert");

const field_type_boolean = require.main.require("lib/base-chips/field-types/boolean.js");

function acceptCorrectly(done) {
    return {
        accept: () => done(),
        reject: (msg) => done(new Error(msg))
    };
}

function rejectCorrectly(done) {
    return {
        accept: () => done(new Error("It accepted!")),
        reject: (msg) => done()
    }
}

describe("FieldType.Boolean", function(){
	it("should return the description of the field type", function(){
		assert.strictEqual(typeof field_type_boolean.get_description(), "string");
	});
	it("should check if is_proper_value works correctly (given boolean)", function(done){
        const {accept, reject} = acceptCorrectly(done);
		const result = field_type_boolean.is_proper_value(accept, reject, new Context(), {}, true);
	});
	it("should check if is_proper_value works correctly (given 1)", function(done){
        const {accept, reject} = acceptCorrectly(done);
        const result = field_type_boolean.is_proper_value(accept, reject, new Context(), {}, 1);
	});
	it("should check if is_proper_value works correctly (given \"true\")", function(done){
        const {accept, reject} = acceptCorrectly(done);
        const result = field_type_boolean.is_proper_value(accept, reject, new Context(), {}, "true");
	});
	it("should check if is_proper_value works correctly (given 2)", function(done){
        const {accept, reject} = rejectCorrectly(done);
        const result = field_type_boolean.is_proper_value(accept, reject, new Context(), {}, 2);
	});
	it("should encode the value correctly (given boolean)", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, true), true);
	});
	it("should encode the value correctly (given 1)", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, 1), true);
	});
	it("should encode the value correctly (given 0)", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, 0), false);
	});
	it("should encode the value correctly (given \"false\")", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, "false"), false);
	});
	it("should encode the value correctly (given \"true\")", function(){
		assert.strictEqual(field_type_boolean.encode(new Context(), {}, "true"), true);
	});
});
