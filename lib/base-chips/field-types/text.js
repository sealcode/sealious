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
	is_proper_value: function(context, params, new_value){
        let checks = [];
		if(params.min_length){
			checks.push( text => {
				if(text.length < params.min_length){
					return Promise.reject(`Text '${new_value}' is too short, minimum length is ${params.min_length} chars.`);
				}
			})
		}
		if(params.max_length){
			checks.push( text => {
				if(text.length > params.max_length){
					return Promise.reject(`Text '${new_value}' has exceeded max length of ${params.max_length} chars`);
				}
			})
		}
		return Promise.all(checks.map(fn => fn(new_value)))
		.then(() => Promise.resolve())
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
