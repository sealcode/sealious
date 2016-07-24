const Context = require.main.require("lib/context.js");
const field_type_date = require.main.require("lib/base-chips/field-types/date.js");
const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Date", function(){
	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_date.name, "date");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_date.get_description(), "string");
	});
	it("checks if is_proper_value works correctly(given correct date format)", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_date.is_proper_value(accept, reject, new Context(), {}, "2015-10-27");
	});
	it("checks if is_proper_value works correctly (given incorrect date format)", function(done){
		const {accept, reject} = rejectCorrectly(done);
		field_type_date.is_proper_value(accept, reject, new Context(), {}, "2015/10/27")
	});
});