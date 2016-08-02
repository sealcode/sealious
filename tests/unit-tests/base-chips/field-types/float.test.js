"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_float = locreq("lib/base-chips/field-types/float.js");
const acceptCorrectly = locreq("tests/util/accept-correctly.js");
const rejectCorrectly = locreq("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Float", function(){
	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_float.name, "float");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_float.get_description(), "string");
	});
	it("checks if is_proper_value works correctly", function(done){
		const accept = acceptCorrectly(done).accept;
		const reject = acceptCorrectly(done).reject;
		field_type_float.is_proper_value(accept, reject, new Context(), {}, 2.5);
	});
	it("returns error because new_value is not an integer", function(done){
		const accept = rejectCorrectly(done).accept;
		const reject = rejectCorrectly(done).reject;
		field_type_float.is_proper_value(accept, reject, new Context(), {}, "janusz");
	});
	it("checks if encode works properly (given \"2\")", function(){
		assert.strictEqual(field_type_float.encode(new Context(), {}, "2.5"), 2.5);
	});
});
