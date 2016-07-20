const Context = require.main.require("lib/context.js");
const field_type_float = require.main.require("lib/base-chips/field-types/float.js");
const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Float", function(){
	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_float.name, "float");
	});
	it("should return the description of the field type", function(){
		assert.strictEqual(typeof field_type_float.get_description(), "string");
	});
	it("should check if is_proper_value works correctly", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_float.is_proper_value(accept, reject, new Context(), {}, 2.5);
	});
	it("should return error because new_value is not an integer", function(done){
		const {accept, reject} = rejectCorrectly(done);
		field_type_float.is_proper_value(accept, reject, new Context(), {}, "janusz");
	});
	it("should check if encode works properly (given \"2\")", function(){
		assert.strictEqual(field_type_float.encode(new Context(), {}, "2.5"), 2.5);
	});
});
