const Context = require.main.require("lib/context.js");
const field_type_hashed_text = require.main.require("lib/base-chips/field-types/hashed-text.js");
const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");

const assert = require("assert");
const crypto = require('crypto');

var assert_no_error = require("../util/assert-no-error.js");

describe("FieldType.HashedText", function(){
	it("returns the name of the field type", function() {
		assert.strictEqual(field_type_hashed_text.name, "hashed-text");
	});
	it("returns the field type it extends from", function() {
		assert.strictEqual(field_type_hashed_text.extends, "text");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_hashed_text.get_description(), "string");
	});
	it("accepts given password ('pas1sw24rd1')", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_hashed_text.is_proper_value(accept, reject, new Context(), {}, "pas1sw24rd1");
	});

	it("accepts given password ('pas1sw24rd1')", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_hashed_text.is_proper_value(accept, reject, new Context(), {digits: 3}, "pas1sw24rd1");
	});

	it("accepts given password ('PAs1sW24rD1')", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_hashed_text.is_proper_value(accept, reject, new Context(), {capitals: 3}, "PAs1sW24rD1");
	});

	it("accepts given password ('PaSw0rd23')", function(done){
		const {accept, reject} = acceptCorrectly(done);
		field_type_hashed_text.is_proper_value(accept, reject, new Context(), {capitals: 2, digits: 3}, "PaSw0rd23");
	});

	it("resolves with a hash (algorithm: 'md5', salt: '')", function(done){
		field_type_hashed_text.encode(new Context(), {}, "test")
		.then(function(result){
			crypto.pbkdf2("test", "", 4096, 64, "md5", function(err, key){
				if (err) done(new Error(err));

				key.toString('hex') === result ? done() : done(new Error("Wrong hash"))
			});
		})
		.catch(function(error){
			done(new Error(error))
		})
	})
})
