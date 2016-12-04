"use strict";

module.exports = {
	name: "same-anon",
	get_pre_aggregation_stage: function(context, params){
		return Promise.resolve([
			{$match: {"created_context.anonymous_user_id": context.anonymous_user_id}},
		]);
	},
	checker_function: function(context, params, item){
		if(context.anonymous_user_id === null){
			return Promise.reject();
		}
		if(context.anonymous_user_id === item.created_context.anonymous_user_id){
			return Promise.resolve();
		} else {
			return Promise.reject("Only the user who created this resource can have access to it");
		}
	},
	item_sensitive: true,
};
