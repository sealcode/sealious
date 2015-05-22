var Promise = require("bluebird");

var Public = new Sealious.ChipTypes.AccessStrategy("public", {
	checker_function: function(context){
		return Promise.resolve("Everybody is a winner!");
	},
	item_sensitive: false,
});