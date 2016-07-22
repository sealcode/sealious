const Promise = require("bluebird");

module.exports = {
	name: "public",
	checker_function: function(context, params, item){
		return Promise.resolve("Everybody is a winner!");
	},
	item_sensitive: false,
};
