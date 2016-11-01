"use strict";
const locreq = require("locreq")(__dirname);
const Errors = locreq("lib/response/error.js");

const human_comparators_to_query = {
	">": "$gt",
	"gt": "$gt",
	"gte": "$gte",
	">=": "$gte",
	"=>": "$gte",
	"<": "$lt",
	"lt": "$lt",
	"lte": "$lte",
	"<=": "$lte",
	"=<": "$lte",
	"=": "$eq",
};

module.exports = {
	name: "int",
	get_description: function(){
		return "An integer number.";
	},
	is_proper_value: function(context, params, new_value){
		if (new_value === null || isNaN(new_value) === true || new_value % 1 !== 0){
			return Promise.reject(`Value '${new_value}' is not a int number format.`);
		} else {
			return Promise.resolve();
		}
	},
	encode: function(context, params, value_in_code){
		const parsed_int = parseInt(value_in_code);
		return parsed_int;
	},
	filter_to_query: function(context, params, field_filter){
		const self = this;
		// treating filter as a query here
		if (typeof field_filter === "object"){
			const new_filter = {};
			for(const comparator in field_filter){
				const new_comparator = human_comparators_to_query[comparator];
				if(new_comparator === undefined){
					throw new Errors.ValidationError(`Unknown comparator: '${  comparator  }'.`);
				}
				new_filter[new_comparator] = parseInt(field_filter[comparator]);
			}
			return new_filter;
		} else {
			return {
				$eq: parseInt(field_filter),
			};
		}
	},
};
