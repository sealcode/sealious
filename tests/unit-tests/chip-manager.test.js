var Sealious = require("sealious");

module.exports = {
	test_init: function(){
		var always_fails_resource = new Sealious.ChipTypes.ResourceType({
			name: "chip_manager_tests_resource",
		});
	},
	test_start: function(){
		describe("ChipManager", function(){
			it("gets all resource types", function(done){
				var names = Sealious.ChipManager.get_all_resource_types();
				if (names instanceof Array)
					if (names.indexOf("chip_manager_tests_resource") > -1)
						done();
				else
					done(new Error("It doesn't contains the created resource"))
				else
					done(new Error("It didn't return the array"))
			})
			it("gets chip by longid (longid exists)", function(done){
				var chip = Sealious.ChipManager.get_chip_by_longid("resource_type.chip_manager_tests_resource");
				if (chip instanceof Object)
					if (chip.type === "resource_type")
						if (chip.name === "chip_manager_tests_resource")
							if (chip.longid === "resource_type.chip_manager_tests_resource")
								done();
				else
					done(new Error("It didn't return the correct longid"));
				else
					done(new Error("It didn't return the correct chip name"));
				else
					done(new Error("It didn't return the correct chip type"));
				else
					done(new Error("It didn't return an object"))
			});
			it("throws an error when get_chip_by_longid has non existent longid", function(done){
				try {
					Sealious.ChipManager.get_chip_by_longid("doesn't exist");
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
				var amount = Sealious.ChipManager.get_chip_amount_by_type("non existent");
				if (amount === 0)
					done();
				else
					done(new Error("It returned something else than 0"))
			});
			it("gets chips by type (type exists)", function(done){
				var chips = Sealious.ChipManager.get_chips_by_type("resource_type");
				if (chips["chip_manager_tests_resource"] !== undefined)
					done();
				else
					done(new Error("It didn't get the chip_manager_tests_resource type"))
			});
			it("gets chips by type (type doesn't exist)", function(done){
				var chips = Sealious.ChipManager.get_chips_by_type("troll_type");
				if (chips === undefined)
					done();
				else
					done(new Error("The result is not undefined"))
			});
		})
	}
}