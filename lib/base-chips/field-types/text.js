"use strict";
const Promise = require("bluebird");
const escape = require("escape-html");

module.exports = {
	name: "text",
	full_text_search_enabled: function(params){
		if (params && params.include_in_search){
			return true;
		} else if (params && params.max_length > 200){
			return true;
		} else {
			return false;
		}
	},
	get_description: function(context, params){
		return `Text with maximum length ${params.max_length}`;
	},
	is_proper_value: function(accept, reject, context, params, new_value){
		if (params === undefined || (params.max_length === undefined && params.min_length === undefined)){
			accept();
		}
		else if (params.max_length !== undefined){
			if (new_value.length <= params.max_length){
				accept();
			} else {
				reject(`Text '${new_value}' has exceeded max length of ${params.max_length} chars`);
			}
		}
		else if (params.min_length !== undefined){
			if (new_value.length >= params.min_length){
				accept();
			} else {
				reject(`Text '${new_value}' is too short, minimum length is ${params.max_length} chars.`);
			}
		}
		else if (params.min_length !== undefined && params.max_length !== undefined){
			if (new_value.length >= params.min_length && new_value.length <= params.max_length){
				accept();
			} else {
				reject(`Text '${new_value}' length should be between ${params.min_length} and ${params.max_length}.`);
			}
		}
	},
	encode: function(context, params, value_in_code){
		if (typeof value_in_code === "string" && value_in_code !== null){
			const result = {
				"original": value_in_code,
				"safe": escape(value_in_code),
				valueOf: function(){
					return value_in_code;
				},
			};
			return Promise.resolve(result);
		} else {
			return Promise.resolve(null);
		}
	},
};
