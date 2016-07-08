var ChipManager = require.main.require("lib/chip-types/chip-manager.js");
var assert = require("assert");

describe("ChipManager", function(){

	var chips = {
		resource_type: {
			test: {},
			test2: {}
		}
	};

	it("gets all resource types", function(done){
		var names = ChipManager.__get_all_resource_types(chips);
		done(assert(names.indexOf("test") > -1 && names.indexOf("test2") > -1));
	})

	it("gets chip by longid (longid exists)", function(done){
		var chip = ChipManager.__get_chip_by_longid(chips, "resource_type.test");
		done(assert(chip == chips.resource_type.test));
	});

	it("throws an error when get_chip_by_longid has non existent longid", function(done){
		try {
			ChipManager.__get_chip_by_longid(chips, "doesn't exist");
			done(new Error("It didn't throw an error"));
		}
		catch (e) {
			if (e.type === "validation")
				done();
			else
				done(new Error(e))
		}
	});

	it("gets chip amount by type and returns 0 (non existent type)", function(done){
		var amount = ChipManager.__get_chip_amount_by_type(chips, "non existent");
		done(assert(amount == 0));
	});

	it("gets chips by type (type exists)", function(done){
		var received_chips = ChipManager.__get_chips_by_type(chips, "resource_type");
		done(assert(received_chips.test == chips.resource_type.test));
	});

	it("gets chips by type (type doesn't exist)", function(done){
		var chips = ChipManager.get_chips_by_type("troll_type");
		if (chips === undefined)
			done();
		else
			done(new Error("The result is not undefined"))
	});
})
