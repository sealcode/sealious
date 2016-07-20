const field_type_color = require.main.require("lib/base-chips/field-types/color.js");
const Context = require.main.require("lib/context.js");
const assert = require("assert");

const acceptCorrectly = require.main.require("tests/util/accept-correctly.js");
const rejectCorrectly = require.main.require("tests/util/reject-correctly.js");

describe("FieldType.Color", function(){
	it("checks if is_proper_value throws an error (wrong value)", function(done){
		const {accept, reject} = rejectCorrectly(done);
		var result = field_type_color.is_proper_value(accept, reject, new Context(), {}, "aaaa");
	});
	it("checks if is_proper_value works correctly (given \"rgb(255, 255, 255)\"", function(done){
		const {accept, reject} = acceptCorrectly(done);
		var result = field_type_color.is_proper_value(accept, reject, new Context(), {}, "rgb(255, 255, 255)");
	});
	it("checks if is_proper_value works correctly (given \"black\"", function(done){
		const {accept, reject} = acceptCorrectly(done);
		var result = field_type_color.is_proper_value(accept, reject, new Context(), {}, "black");
	});
	it("checks if is_proper_value works correctly (given \"BLACK\"", function(done){
		const {accept, reject} = acceptCorrectly(done);
		var result = field_type_color.is_proper_value(accept, reject, new Context(), {}, "BLACK");
	});
	it("checks if is_proper_value works correctly (given \"#000000\"", function(done){
		const {accept, reject} = acceptCorrectly(done);
		var result = field_type_color.is_proper_value(accept, reject, new Context(), {}, "#000000");
	});
	it("checks if is_proper_value works correctly (given \"{r: 255, g: 255, b: 255}\"", function(done){
		const {accept, reject} = acceptCorrectly(done);
		var result = field_type_color.is_proper_value(accept, reject, new Context(), {r: 255, g: 255, b: 255});
	});
	it("checks if is_proper_value works correctly (given \"hsla(262, 59%, 81%, 0.5)\"", function(done){
		const {accept, reject} = acceptCorrectly(done);
		var result = field_type_color.is_proper_value(accept, reject, new Context(), "hsla(262, 59%, 81%, 0.5)");
	});
	it("checks if encode works correctly", function(){
		assert.strictEqual(field_type_color.encode(new Context(), {}, {r: 0, g: 0, b: 0}), "#000000");
	});
	it("checks if encode works correctly", function(){
		assert.strictEqual(field_type_color.encode(new Context(), {}, "black"), "#000000");
	});
	it("checks if encode works correctly", function(){
		assert.strictEqual(field_type_color.encode(new Context(), {}, "hsl(0,0%,0%)"), "#000000");
	});
});
