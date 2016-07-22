const Promise = require("bluebird");

module.exports = {
	name: "noone",
	checker_function: function(context, params, item){
		return Promise.reject("Noone gets in!");
	},
	item_sensitive: false,
};
