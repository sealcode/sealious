const Promise = require("bluebird");

module.exports = {
	name: "noone",
	checker_function: function(){
		return Promise.reject("Noone gets in!");
	},
	item_sensitive: false
};
