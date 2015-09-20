var Sealious = require("../main.js");
var Promise = require("bluebird");

var JustOwner = new Sealious.ChipTypes.AccessStrategy({
	name: "just_owner",
	checker_function: function(context, item) {
		if (context.get("user_id") === item.created_context.user_id) {
			return Promise.resolve();
		} else {
			return Promise.reject("Only the owner of this resource can perform this operation on this item.");
		};
	},
	item_sensitive: true
});