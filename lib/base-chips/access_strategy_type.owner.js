var Sealious = require("sealious");
var Promise = require("bluebird");

var JustOwner = new Sealious.ChipTypes.AccessStrategyType({
	name: "owner",
	item_sensitive: true,
	checker_function: function(context, params, item){
		if (context.user_id === item.created_context.user_id) {
			return Promise.resolve();
		} else {
			return Promise.reject("Only the owner of this resource can perform this operation on this item.");
		}
	},
});
