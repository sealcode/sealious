var Sealious = require("sealious");
var Promise = require("bluebird");

var Public = new Sealious.ChipTypes.AccessStrategy({
	name: "noone",
	checker_function: function(context){
		return Promise.reject("Noone gets in!");
	},
	item_sensitive: false,
});