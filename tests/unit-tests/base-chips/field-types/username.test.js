"use strict";
const locreq = require("locreq")(__dirname);

const Context = locreq("lib/context.js");
const field_type_username_fn = locreq("lib/app/base-chips/field-types/username.js");
const app = {};
const field_type_username = field_type_username_fn(app);

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");
const assert_error = locreq("tests/util/assert-error.js");

describe("FieldType.Username", function(){

	test_is_proper_value({
		field_type: field_type_username,
		should_accept: [
			["the same value as in old_value", "username", {}, "username"],
		],
		should_reject: [
			["a reserced keyword", "me"],
		]
	});

	it("rejects when the given username already exists and is a new value", function(done){
		const mockup_app = {
			run_action: function(){
				return Promise.resolve(["i exist"]);
			}
		};

		assert_error(
			field_type_username_fn(mockup_app).is_proper_value(
				new Context(),
				{},
				"username",
				"different_username"
			),
			done
		);
	});


	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_username.name, "username");
	});
    it("returns the name of the field type it extends", function(){
        assert.strictEqual(field_type_username.extends, "text");
    });
});
