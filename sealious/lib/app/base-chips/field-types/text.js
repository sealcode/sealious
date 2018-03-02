"use strict";
const Promise = require("bluebird");
const escape = require("escape-html");

module.exports = {
	name: "text",
	has_index: function(params){
		if(params.full_text_search || params.include_in_search){
			return {original: "text"};
		}else{
			return false;
		}
	},
	get_description: function(context, params){
		return `Text with maximum length ${params.max_length}`;
	},
	is_proper_value: function(context, params, new_value){
        const checks = [];
		if(params.min_length){
			checks.push((text) => {
				if(text.length < params.min_length){
					return Promise.reject(`Text '${new_value}' is too short, minimum length is ${params.min_length} chars.`);
				}
			});
		}
		if(params.max_length){
			checks.push((text) => {
				if(text.length > params.max_length){
					return Promise.reject(`Text '${new_value}' has exceeded max length of ${params.max_length} chars`);
				}
			});
		}
		return Promise.all(checks.map(fn => fn(new_value)))
		.then(() => Promise.resolve());
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
	get_aggregation_stages: function(context, params, field_name, query_params){
		const filter_value = query_params.filter && query_params.filter[field_name];
		if(filter_value){
			if(filter_value.regex){
				const regex_options = "i";
				const regex_query = {$regex: filter_value.regex, $options: regex_options};
				return [
					{
						$match: {
							$or: [
								{
									[`body.${  field_name  }.original`]: regex_query,
								},
								{
									[`body.${  field_name  }.safe`]: regex_query,
								}
							]
						},
					},
				];
			}else{
				const value_query = {$eq: filter_value};
				return [
					{
						$match: {
							$or: [
								{
									[`body.${  field_name  }.original`]: filter_value,
								},
								{
									[`body.${  field_name  }.safe`]: filter_value,
								}
							]
						},
					},
				];
			}
		}else{
			return [];
		}
	},
	format: function(context, params, decoded_value, format){
		if(decoded_value === null || decoded_value === undefined){
			return Promise.resolve(decoded_value);
		}
		if(format === undefined){
			return decoded_value.safe;
		}
		return decoded_value[format] ? decoded_value[format] : decoded_value;
	},
};
