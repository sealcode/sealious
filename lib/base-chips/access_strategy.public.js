var Promise = require("bluebird");

var Public = new Sealious.ChipTypes.AccessStrategy("public", {
	checker_function: function(context){
		return Promise.resolve("Noone gets in!");
	},
	item_sensitive: false,
});