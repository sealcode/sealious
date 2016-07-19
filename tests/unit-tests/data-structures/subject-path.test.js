var SubjectPath = require.main.require("lib/data-structures/subject-path.js");
const assert = require("assert");

describe("SubjectPath", function(){

	it("can be constructed from string", function(){
		var d = new SubjectPath("foo.bar.baz");
		assert.strictEqual(d.elements[0], "foo");
		assert.strictEqual(d.elements[1], "bar");
		assert.strictEqual(d.elements[2], "baz");
	});

	it("can be contructed from array", function(){
		var elements = ["foo", "bar", "baz"];
		var d = new SubjectPath(elements);
		assert.strictEqual(d.elements[0], "foo");
		assert.strictEqual(d.elements[1], "bar");
		assert.strictEqual(d.elements[2], "baz");
	});

	it("can be constructed from an instance of itself", function(){
		var elements = ["foo", "bar", "baz"];
		var d = new SubjectPath(elements);
		var d2 = new SubjectPath(d);
		assert.strictEqual(d2.elements[0], "foo");
		assert.strictEqual(d2.elements[1], "bar");
		assert.strictEqual(d2.elements[2], "baz");
	});
})
