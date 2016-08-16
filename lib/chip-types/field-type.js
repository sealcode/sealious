"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const ChipManager = locreq("lib/chip-types/chip-manager.js");
const Errors = locreq("lib/response/error.js");
const default_methods = require("./field-type-default-methods.js");


function wrap_method_in_promise (context, declaration, method_name){
	return function(){
		return Promise.resolve(declaration[method_name].apply(context, arguments));
	};
}

const FieldType = function(declaration){
	const ChipManager = locreq("lib/chip-types/chip-manager.js"); // for some reason it doesn't work when placed at the beginning
	let self;

	if (declaration instanceof FieldType){
		return declaration;
	} else if (typeof declaration === "string"){
		return ChipManager.get_chip("field_type", declaration);
	} else if (declaration.extends){
		const parent_field_type = ChipManager.get_chip("field_type", declaration.extends);
		self = Object.create(parent_field_type);
	} else {
		self = this;
		for (const method_name in default_methods){
			self[method_name] = default_methods[method_name];
		}
	}

	if (declaration.name){
		ChipManager.add_chip("field_type", declaration.name, self);
	}

	for (const prop_name in declaration){
		if (default_methods[prop_name] !== undefined){
			self[prop_name] = wrap_method_in_promise(self, declaration, prop_name);
		} else {
			self[prop_name] = declaration[prop_name];
		}
	}

	return self;
};


module.exports = FieldType;
