"use strict";
const locreq = require("locreq")(__dirname);
const Response = locreq("lib/response/response.js");
const Errors = locreq("lib/response/error.js");

const Context = locreq("lib/context.js");

const assert = require("assert");

describe("Sealious.Response", function(){
	it("returns a Response object", function(){
		const response = new Response({test: 1}, false, "my_type", "my_status_message");
		assert.deepEqual(response.data, {test: 1});
		assert.strictEqual(response.status, "success");
		assert.strictEqual(response.type, "my_type");
		assert.strictEqual(response.status_message, "my_status_message");
	});
	it("returns a Response object from an error", function() {
		const error = new Errors.BadContext("This is an error", "test_data");
		const response = Response.fromError(error);
		assert.strictEqual(response.data, "test_data");
		assert.strictEqual(response.message.type, "permission");
		assert.strictEqual(response.status_message.content, "This is an error");
	});
});
