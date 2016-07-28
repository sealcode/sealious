const Promise = require("bluebird");

const ChipManager = require.main.require("lib/chip-types/chip-manager.js");
const Errors = require.main.require("lib/response/error.js");
const default_methods = require("./field-type-default-methods.js");
const methods_with_accept_reject_interface = new Set(["is_proper_value"]);


function wrap_method_in_accept_reject (declaration, method_name){
	return function(){
		const that = this;
		const arguments_array = Object.keys(arguments).map((key)=>arguments[key]);
		return new Promise(function(resolve, reject){
			const accept = resolve;
			const new_reject = function(error){
				if (typeof error === "string"){
					reject(new Errors.ValidationError(error));
				} else {
					reject(error);
				}
			};
			arguments_array.unshift(accept, new_reject);
			declaration[method_name].apply(this, arguments_array);
		});
	};
}

function wrap_method_in_promise (declaration, method_name){
	return function(){
		return Promise.resolve(declaration[method_name].apply(this, arguments));
	};
}

const FieldType = function(declaration){
	const ChipManager = require.main.require("lib/chip-types/chip-manager.js"); // for some reason it doesn't work when placed at the beginning
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
			if (methods_with_accept_reject_interface.has(prop_name)){
				self[prop_name] = wrap_method_in_accept_reject(declaration, prop_name);
			} else {
				self[prop_name] = wrap_method_in_promise(declaration, prop_name);
			}
		} else {
			self[prop_name] = declaration[prop_name];
		}
	}

	return self;
};


module.exports = FieldType;
