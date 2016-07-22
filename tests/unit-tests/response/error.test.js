const Errors = require.main.require("lib/response/error.js");
const assert = require("assert");

describe("Sealious.Errors", function(){
	it("transforms an Error to an object", function() {
		const error = new Errors.Error("Example error");
		const error_to_object = error.to_object();
		assert.strictEqual(error_to_object.message, "Example error");
		assert.strictEqual(error_to_object.type, "error");
		assert.deepEqual(error_to_object.data, {});
	});
	it("throws a Sealious.Errors.Error", function(){
		const erronous = function() {
			throw new Errors.Error("This is just an error", {type: "test_error"});
		}
		const checkError = function(err) {
			if (err.type === "test_error") {
				return true;
			}
		}
		assert.throws(erronous, checkError, "Unexpected error");
	});
	it("throws a Sealious.Errors.ValidationError", function(){
		const erronous = function() {
			throw new Errors.ValidationError("This is just an error");
		}
		const checkError = function(err) {
			if (err.type === "validation") {
				return true;
			}
		}
		assert.throws(erronous, checkError, "Unexpected error");
	});
	it("throws a Sealious.Errors.ValueExists", function(){
		const erronous = function() {
			throw new Errors.ValueExists("This is just an error");
		}
		const checkError = function(err) {
			if (err.type === "value_exists") {
				return true;
			}
		}
		assert.throws(erronous, checkError, "Unexpected error");
	});
	it("throws a Sealious.Errors.InvalidCredentials", function(){
		const erronous = function() {
			throw new Errors.InvalidCredentials("This is just an error");
		}
		const checkError = function(err) {
			if (err.type === "invalid_credentials") {
				return true;
			}
		}
		assert.throws(erronous, checkError, "Unexpected error");
	});
	it("throws a Sealious.Errors.NotFound", function(){
		const erronous = function() {
			throw new Errors.NotFound("This is just an error");
		}
		const checkError = function(err) {
			if (err.type === "not_found") {
				return true;
			}
		}
		assert.throws(erronous, checkError, "Unexpected error");
	});
	it("throws a Sealious.Errors.DeveloperError", function(){
		const erronous = function() {
			throw new Errors.DeveloperError("This is just an error");
		}
		const checkError = function(err) {
			if (err.type === "dev_error") {
				return true;
			}
		}
		assert.throws(erronous, checkError, "Unexpected error");
	});
	it("throws a Sealious.Errors.BadContext", function(){
		const erronous = function() {
			throw new Errors.BadContext("This is just an error");
		}
		const checkError = function(err) {
			if (err.type === "permission") {
				return true;
			}
		}
		assert.throws(erronous, checkError, "Unexpected error");
	});
});
