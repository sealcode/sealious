var Sealious = require("sealious");

var default_methods = require("./field-type-default-methods.js");

function Field (declaration) {

	this.name = declaration.name;
	this.declaration = declaration;
	this.type = new Sealious.FieldType(declaration.type);
	this.required = declaration.required || false;
	this.params = declaration.params || {};

	var self = this;

	for (var method_name in default_methods){
		this[method_name] = (function(method_name){
			return function(){
				var arguments_array = Object.keys(arguments).map((key)=>arguments[key]);
				arguments_array.splice(1, 0, this.params);
				return self.type[method_name].apply(self.type, arguments_array);
			}
		})(method_name);
	}

}

module.exports = Field;
