"use strict";

module.exports = {
	name: "same-anon",
	checker_function: function(context, params, item){
		if(context.anonymous_session_id === item.created_context.anonymous_session_id){
			return Promise.resolve();
		} else {
			return Promise.reject("Only the user who created this resource can have access to it");
		}
	},
	item_sensitive: true,
};
