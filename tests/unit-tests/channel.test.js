//var Channel = require('../../lib/chip-types/chip.js');
var Sealious = require('sealious');


module.exports = {
	test_init: function(){

	},
	test_start: function(){
		describe("Channel", function(){
			it("adds new channel", function(done){
				Sealious.ChipTypes.Channel("new_test_channel");
				var result = Sealious.ChipManager.get_chip("channel", "new_test_channel")
				if (result.name === "new_test_channel")
					done();
				else
					done(new Error("It didn't return the correct channel"))
			})
		})
	}
}
