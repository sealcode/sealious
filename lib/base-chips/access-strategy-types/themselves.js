var Sealious = require("sealious");
var Promise = require("bluebird");

var themselves = new Sealious.AccessStrategyType({
	name: "themselves",
	item_sensitive: true,
	checker_function: function(context, params, item){
		if (context.user_id === item.id){
			return Promise.resolve();
		} else {
			return Promise.reject(`You are not the user of id ${item.id}.`)
		}
	}
});
