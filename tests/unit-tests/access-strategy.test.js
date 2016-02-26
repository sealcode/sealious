var Sealious = require('sealious');

module.exports = {
	test_init: function(){
		new Sealious.ChipTypes.AccessStrategyType({
			name: "test_access_strategy",
			checker_function: function(context){
				return Promise.resolves();
			},
			item_sensitive: false,
		});
	},
	test_start: function(){
		describe("AccessStrategy", function(){
			it("finds tests_access_strategy", function(done){
				var result = Sealious.ChipManager.get_chip("access_strategy_type", "test_access_strategy")
				if (result.name === "test_access_strategy")
					done();
				else
					done("The names don't match");
			})
		})
	}
}
