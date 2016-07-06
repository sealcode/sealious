var Sealious = require("sealious");
var Promise = require("bluebird");

var Public = new Sealious.ChipTypes.AccessStrategyType({
	name: "public",
	checker_function: function(context, params, item){
		return Promise.resolve("Everybody is a winner!");
	},
	item_sensitive: false,
});
