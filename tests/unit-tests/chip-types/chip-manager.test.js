var ChipManager = require.main.require("lib/chip-types/chip-manager.js");
var assert = require("assert");

describe("ChipManager", function(){

	var chips = {
		resource_type: {
			test: {},
			test2: {}
		}
	};

	it("gets all resource types", function(){
		var names = ChipManager.__get_all_resource_types(chips);
		assert.notStrictEqual(names.indexOf("test"), -1);
		assert.notStrictEqual(names.indexOf("test2"), -1);
	});

	it("gets chip by longid (longid exists)", function(){
		var chip = ChipManager.__get_chip_by_longid(chips, "resource_type.test");
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
		var amount = ChipManager.__get_chip_amount_by_type(chips, "non existent");
		assert.strictEqual(amount, 0);
	});

	it("gets chips by type (type exists)", function(){
		var received_chips = ChipManager.__get_chips_by_type(chips, "resource_type");
		assert.strictEqual(received_chips.test, chips.resource_type.test);
	});

	it("gets chips by type (type doesn't exist)", function(){
		var chips = ChipManager.get_chips_by_type("troll_type");
		assert.strictEqual(chips, undefined);
	});
})
