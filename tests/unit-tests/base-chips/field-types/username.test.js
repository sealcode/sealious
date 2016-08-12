"use strict";
const locreq = require("locreq")(__dirname);

const Context = locreq("lib/context.js");
const field_type_username = locreq("lib/base-chips/field-types/username.js");
const acceptCorrectly = locreq("tests/util/accept-correctly.js");
const rejectCorrectly = locreq("tests/util/reject-correctly.js");

const assert = require("assert");

describe("FieldType.Username", function(){
	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_username.name, "username");
	});
    it("returns the name of the field type it extends", function(){
        assert.strictEqual(field_type_username.extends, "text");
    });
	it("checks if is_proper_value works correctly (old value equals new value)", function(done){
		const accept = acceptCorrectly(done).accept;
		const reject = acceptCorrectly(done).reject;
		field_type_username.is_proper_value(accept, reject, new Context(), {}, "troll", "troll");
	});
    it("checks if is_proper_value works correctly (new value is a reserved keyword)", function(done){
		const accept = rejectCorrectly(done).accept;
		const reject = rejectCorrectly(done).reject;
        field_type_username.is_proper_value(accept, reject, new Context(), {}, "me");
    });
    // it("checks if is_proper_value works correctly", function(done){
	// const accept = rejectCorrectly(done).accept;
	// const reject = rejectCorrectly(done).reject;
    //     field_type_username.is_proper_value(accept, reject, new Context(), {}, "test", "lol");
    // });
});
