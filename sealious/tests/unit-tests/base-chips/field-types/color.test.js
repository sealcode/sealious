"use strict";
const locreq = require("locreq")(__dirname);
const field_type_color = locreq("lib/app/base-chips/field-types/color.js");
const Context = locreq("lib/context.js");
const assert = require("assert");

const test_is_proper_value = locreq("tests/util/test-is-proper-value.js");

describe("FieldType.Color", function(){
	test_is_proper_value({
		field_type: field_type_color,
		should_accept: [
			["hex", "#ff00ff"],
			["shorthex", "#fff"],
			["hsl", "hsl(0, 0%, 0%)"],
			["hsl", "hsl(240, 100%, 80%)"],
			["named color", "red"],
			["rgb string", "rgb(255, 255, 255)"],
			["rgb object",  {r: 255, g: 255, b: 255}],
			["hsla string", "hsla(262, 59%, 81%, 0.5)"],
		],
		should_reject: [
			["random string of text", "o87at gfoi4sg6npw98sh"],
			["malformed hsl", "hsl(240, 100%, 80%"],
		]
	});

	it("returns the name of the field type", function(){
		assert.strictEqual(field_type_color.name, "color");
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
