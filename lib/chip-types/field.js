"use strict";
const locreq = require("locreq")(__dirname);
const default_methods = require("./field-type-default-methods.js");
const FieldType = locreq("lib/chip-types/field-type.js");

function Field(app, declaration, collection) {
	this.name = declaration.name;
	this.declaration = declaration;
	this.type = new FieldType(app, declaration.type);
	this.value_path =
		"body." + this.name + (this.type.value_path_after_field_name || "");
	this.required = declaration.required || false;
	this.params = declaration.params || {};
	this.type.init(collection, declaration.name, this.params);

	const self = this;

	for (const method_name in default_methods) {
		this[method_name] = (function(method_name) {
			return function() {
				const arguments_array = Array.from(arguments);
				arguments_array.splice(1, 0, self.params);
				return self.type[method_name].apply(self.type, arguments_array);
			};
		})(method_name);
	}

	this.get_specification = function() {
		return {
			name: this.name,
			type: this.type,
			params: this.params,
		};
	};

	this.get_aggregation_stages = function(context, query_params) {
		return Promise.resolve(
			this.type.get_aggregation_stages(
				context,
				this.params,
				this.name,
				this.value_path,
				query_params
			)
		);
	};
}

module.exports = Field;
