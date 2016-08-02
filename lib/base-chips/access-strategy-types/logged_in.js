const Promise = require("bluebird");

module.exports = {
	name: "logged_in",
	checker_function: function(context){
		if (context.user_id){
			return Promise.resolve();
		} else {
			return Promise.reject("Only logged-in users can perform this action.");
		}
	},
};
