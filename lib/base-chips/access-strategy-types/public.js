const Sealious = require("sealious");
const Promise = require("bluebird");

module.exports = new Sealious.ChipTypes.AccessStrategyType({
	name: "public",
	checker_function: function(){
		return Promise.resolve("Everybody is a winner!");
	},
	item_sensitive: false,
});
