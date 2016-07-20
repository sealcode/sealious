const Context = require.main.require("lib/context.js");
const field_type_email = require.main.require("lib/base-chips/field-types/email.js");
const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Email", function(){
	it("return the name of the field type", function() {
		assert.strictEqual(field_type_email.name, "email");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_email.get_description(), "string");
	});
	it("checks if is_proper_value works correctly(given correct date format)", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_email.is_proper_value(accept, reject, new Context(), {}, "test@mail.com");
	});
	it("checks if is_proper_value works correctly(given incorrect date format)", function(done){
		const {accept, reject} = rejectCorrectly(done);
		field_type_email.is_proper_value(accept, reject, new Context(), {}, "test");
	});
});
