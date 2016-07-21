const Sealious = require("sealious");
const Promise = require("bluebird");

module.exports = new Sealious.ChipTypes.AccessStrategyType({
	name: "noone",
	checker_function: function(){
		return Promise.reject("Noone gets in!");
	},
	item_sensitive: false,
});
