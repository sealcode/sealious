var Promise = require("bluebird");

var FieldTypeDescription = require("../data-structures/field-type-description.js");

var default_methods = {
	is_proper_value: function(context, params, new_value, old_value){
		return Promise.resolve();
	},

	format: function(context, params, decoded_value, format_params){
		return Promise.resolve(decoded_value);
	},

	encode: function(context, params, value_in_code){
		return Promise.resolve(value_in_code)
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
				$eq: encoded_value
			}
		})
	},

	full_text_search_enabled: function(){
		return false;
	}
}

module.exports = default_methods;
