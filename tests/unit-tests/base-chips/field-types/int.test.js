const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_int = locreq("lib/base-chips/field-types/int.js");
const acceptCorrectly = locreq("tests/util/accept-correctly.js");
const rejectCorrectly = locreq("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Int", function(){
	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_int.name, "int");
	});
	it("should return the description of the field type", function(){
		assert.strictEqual(typeof field_type_int.get_description(), "string")
	});
	it("should check if is_proper_value works correctly", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_int.is_proper_value(accept, reject, new Context(), {}, 2);
	});
	it("should return error because new_value is not an integer", function(done){
		const {accept, reject} = rejectCorrectly(done);
		field_type_int.is_proper_value(accept, reject, new Context(), {}, "janusz");
	});
	it("should check if encode works properly (given \"2\")", function(){
		assert.strictEqual(field_type_int.encode(new Context(), {}, "2"), 2);
	});
});
