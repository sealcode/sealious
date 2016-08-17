"use strict";
const locreq = require("locreq")(__dirname);
const Context = locreq("lib/context.js");
const field_type_hashed_text = locreq("lib/base-chips/field-types/hashed-text.js");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

const assert = require("assert");
const crypto = require("crypto");

describe("FieldType.HashedText", function(){

	test_is_proper_value({
        field_type: field_type_hashed_text,
        should_accept: [
            ["any password, if no params are given", "password"],
			["a proper password when 3 digits are required", "pass1sw2rd1", {digits: 3}],
			["a proper password when 3 capitals are required", "PASword", {capitals: 3}],
			["a proper password when 3 capitals and and 3 digits are required", "PASSword123", {capitals: 3, digits: 3}],
        ],
        should_reject: [
            ["a password with insufficient amount of digits", "password", {digits: 3}],
            ["a password with insufficient amount of capitals", "password", {capitals: 3}],
			["a password with enough capitals, but not enough digits", "PASSword", {capitals: 3, digits: 3}] 
        ]
    });

	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_hashed_text.name, "hashed-text");
	});
	it("returns the field type it extends from", function(){
		assert.strictEqual(field_type_hashed_text.extends, "text");
	});
	it("returns the description of the field type", function(){
		assert.strictEqual(typeof field_type_hashed_text.get_description(), "string");
	});
	it("returns the description of the field type with params", function(){
		const desc = field_type_hashed_text.get_description(new Context, {digits: 4, capitals: 2});
		assert.notStrictEqual(desc.indexOf("required digits: 4"), -1);
		assert.notStrictEqual(desc.indexOf("required capitals: 2"), -1);
	});
	it("resolves with a hash (algorithm: 'md5', salt: '')", function(done){
		field_type_hashed_text.encode(new Context(), {}, "test")
		.then(function(result){
			crypto.pbkdf2("test", "", 4096, 64, "md5", function(err, key){
				if (err) done(new Error(err));

				assert.strictEqual(key.toString("hex"), result);
				done();
			});
		})
		.catch(function(error){
			done(new Error(error));
		});
	});
	it("encodes the password with custom params", function(done){
		field_type_hashed_text.encode(new Context(), {salt: "", algorithm: "md5"}, "test")
		.then(function(result){
			crypto.pbkdf2("test", "", 4096, 64, "md5", function(err, key){
				if (err) done(new Error(err));

				assert.strictEqual(key.toString("hex"), result);
				done();
			});
		})
		.catch(function(error){
			done(new Error(error));
		});
	});
	it("decodes the password - returns null", function(){
		assert.strictEqual(field_type_hashed_text.decode(new Context(), {hide_hash: true}), null);
	});
	it("decodes the password - returns the value in the database", function(){
		assert.strictEqual(field_type_hashed_text.decode(new Context(), false, "value_in_db"), "value_in_db");
	});
});
