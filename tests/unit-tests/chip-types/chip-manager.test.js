const locreq = require("locreq")(__dirname);
const ChipManager = locreq("lib/chip-types/chip-manager.js");
const assert = require("assert");

describe("ChipManager", function(){

	const chips = {
		resource_type: {
			test: {},
			test2: {}
		}
	};

	it("gets all resource types", function(){
		const names = ChipManager.__get_all_resource_types(chips);
		assert.notStrictEqual(names.indexOf("test"), -1);
		assert.notStrictEqual(names.indexOf("test2"), -1);
	});

	it("gets chip by longid (longid exists)", function(){
		const chip = ChipManager.__get_chip_by_longid(chips, "resource_type.test");
		assert.strictEqual(chip, chips.resource_type.test);
	});

	it("throws an error when get_chip_by_longid has non existent longid", function(){
		assert.throws(
			function() {
				ChipManager.__get_chip_by_longid(chips, "doesn't exist");
			},
			function(err) {
				if (err.type === "validation"){
					return true;
				}
			},
			"unexpected error"
		);
	});

	it("gets chip amount by type and returns 0 (non existent type)", function(){
		const amount = ChipManager.__get_chip_amount_by_type(chips, "non existent");
		assert.strictEqual(amount, 0);
	});

	it("gets chips by type (type exists)", function(){
		const received_chips = ChipManager.__get_chips_by_type(chips, "resource_type");
		assert.strictEqual(received_chips.test, chips.resource_type.test);
	});

	it("gets chips by type (type doesn't exist)", function(){
		const chips = ChipManager.get_chips_by_type("troll_type");
		assert.strictEqual(chips, undefined);
	});
})
