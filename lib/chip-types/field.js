const default_methods = require("./field-type-default-methods.js");
const FieldType = require.main.require("lib/chip-types/field-type.js");

function Field (declaration){

	this.name = declaration.name;
	this.declaration = declaration;
	this.type = new FieldType(declaration.type);
	this.required = declaration.required || false;
	this.params = declaration.params || {};

	const self = this;

	for (const method_name in default_methods){
		this[method_name] = (function(method_name){
			return function(){
				const arguments_array = Object.keys(arguments).map((key)=>arguments[key]);
				arguments_array.splice(1, 0, this.params);
				return self.type[method_name].apply(self.type, arguments_array);
			};
		})(method_name);
	}

}

module.exports = Field;
