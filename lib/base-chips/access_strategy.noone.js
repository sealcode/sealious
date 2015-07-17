var Sealious = require("../main.js");
var Promise = require("bluebird");

var Public = new Sealious.ChipTypes.AccessStrategy("noone", {
	checker_function: function(context){
		return Promise.reject("Noone gets in!");
	},
	item_sensitive: false,
});