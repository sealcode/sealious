const Promise = require("bluebird");

module.exports = {
	name: "public",
	checker_function: function(){
		return Promise.resolve("Everybody is a winner!");
	},
	item_sensitive: false
};
