"use strict";
const Promise = require("bluebird");
const expandHash = require("expand-hash");

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
	get_aggregation_stages: function(context, params, field_name, query_params){
		const self = this;
		if(!query_params || !query_params.filter) return Promise.resolve([]);
		const expanded_filter = expandHash(query_params.filter);
		const field_filter = expanded_filter[field_name];
		if(!(field_name in expanded_filter)){
			return Promise.resolve([]);
		}
		if(field_name in expanded_filter && field_filter === undefined)
			return Promise.resolve([{$match: {[`body.${field_name}`]: {$exists: false}}}]);
		let new_filter = null;
		if(field_filter instanceof Array){
			new_filter = Promise.all(
				field_filter.map(self.encode.bind(self, context))
			)
				.then((filters)=> {
					return {$in: filters};
				});
		}else{
			new_filter = self.filter_to_query(context, params, field_filter);
		}
		return new_filter
			.then(function(filter){
				return [
					{$match: {[`body.${field_name}`]: filter}},
				];
			});
	},
};

module.exports = default_methods;
