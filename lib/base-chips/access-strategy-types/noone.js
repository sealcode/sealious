var Sealious = require("sealious");
var Promise = require("bluebird");

var Public = new Sealious.ChipTypes.AccessStrategyType({
	name: "noone",
	checker_function: function(context, params, item){
		return Promise.reject("Noone gets in!");
	},
	item_sensitive: false,
});
