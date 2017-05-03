"use strict";
const locreq = require("locreq")(__dirname);
const ChipManager = locreq("lib/app/chip-manager.js");
const assert = require("assert");

describe("ChipManager", function(){

	const chips = {
		collection: {
			test: {},
			test2: {}
		}
	};

	it("gets all resource types", function(){
		const names = ChipManager.pure.get_all_collections(chips);
		assert.notStrictEqual(names.indexOf("test"), -1);
		assert.notStrictEqual(names.indexOf("test2"), -1);
	});

	it("gets chip amount by type and returns 0 (non existent type)", function(){
		const amount = ChipManager.pure.get_chip_amount_by_type(chips, "non existent");
		assert.strictEqual(amount, 0);
	});

	it("gets chips by type (type exists)", function(){
		const received_chips = ChipManager.pure.get_chips_by_type(chips, "collection");
		assert.strictEqual(received_chips.test, chips.collection.test);
	});

	it("gets chips by type (type doesn't exist)", function(){
		const chips = ChipManager.pure.get_chips_by_type({}, "troll_type");
		assert.strictEqual(chips, undefined);
	});
})