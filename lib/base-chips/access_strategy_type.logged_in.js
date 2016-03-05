var Sealious = require("sealious");

var logged_in = module.exports = new Sealious.AccessStrategyType({
	name: "logged_in",
	checker_function: function(context, params, item){
		if (context.user_id){
			return Promise.resolve();
		} else {
			return Promise.reject("Only logged-in users can perform this action.");
		}
	}
})
