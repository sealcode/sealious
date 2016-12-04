"use strict";
const Promise = require("bluebird");

const FieldTypeDescription = require("../data-structures/field-type-description.js");

const default_methods = {
	has_index: function(params){
		return false;
	},
	is_proper_value: function(context, params, new_value, old_value){
		return Promise.resolve();
	},
	format: function(context, params, decoded_value, format_params){
		return decoded_value;
	},
	encode: function(context, params, value_in_code){
		return value_in_code;
	},
	get_description: function(context, params){
		return new FieldTypeDescription(this.name);
	},
	decode: function(context, params, value_in_database){
		return value_in_database;
	},
	filter_to_query: function(context, params, query){
		return Promise.resolve(this.encode(context, params, query))
		.then(function(encoded_value){
			return {
				$eq: encoded_value,
			};
		});
	},
	full_text_search_enabled: function(){
		return false;
	},
};

module.exports = default_methods;
