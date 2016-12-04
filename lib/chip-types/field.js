"use strict";
const locreq = require("locreq")(__dirname);
const default_methods = require("./field-type-default-methods.js");
const FieldType = locreq("lib/chip-types/field-type.js");
const expandHash = require("expand-hash");

function Field (app, declaration){

	this.name = declaration.name;
	this.declaration = declaration;
	this.type = new FieldType(app, declaration.type);
	this.required = declaration.required || false;
	this.params = declaration.params || {};

	const self = this;

	for (const method_name in default_methods){
		this[method_name] = (function(method_name){
			return function(){
				const arguments_array = Object.keys(arguments).map((key)=>arguments[key]);
				arguments_array.splice(1, 0, self.params);
				return self.type[method_name].apply(self.type, arguments_array);
			};
		})(method_name);
	}

	this.get_specification = function(){
		return {
			name: this.name,
			type: this.type,
			params: this.params,
		};
	};

	this.get_aggregation_stages = function(context, query_params){
		const self = this;
		if(this.type.get_aggregation_stages){
			return Promise.resolve(
				self.type.get_aggregation_stages(context, self.params, self.name, query_params)
			);
		}else{
			if(!query_params.filter) return Promise.resolve([]);
			const expanded_filter = expandHash(query_params.filter);
			const field_filter = expanded_filter[self.name];
			if(!(self.name in expanded_filter)){
				return Promise.resolve([]);
			}
			if(self.name in expanded_filter && field_filter === undefined)
				return Promise.resolve([{$match: {[`body.${self.name}`]: {$exists: false}}}]);
			let new_filter = null;
			if(field_filter instanceof Array){
				new_filter = Promise.all(
					field_filter.map(self.encode.bind(self, context))
				)
				.then((filters)=> {
					return {$in: filters};
				});
			}else{
				new_filter = self.type.filter_to_query(context, self.params, field_filter);
			}
			return new_filter
			.then(function(filter){
				return [
					{$match: {[`body.${  self.name}`]: filter}},
				];
			});
		}
	};

}

module.exports = Field;
