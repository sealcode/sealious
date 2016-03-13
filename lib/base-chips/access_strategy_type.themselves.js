var Sealious = require("sealious");

var themselves = new Sealious.AccessStrategyType({
	name: "themselves",
	checker_function: function(context, params, item){
		if (context.user_id === item.id){
			return Promise.resolve();
		} else {
			return Promise.reject(`You are not the user of id ${item.id}.`)
		}
	}
});
