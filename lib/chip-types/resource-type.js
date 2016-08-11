"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const merge = require("merge");
const clone = require("clone");

const ChipManager = locreq("lib/chip-types/chip-manager.js");
const Errors = locreq("lib/response/error.js");
const Chip = require("./chip.js");
const Field = require("./field.js");
const AccessStrategy = require("./access-strategy.js");
const AccessStrategyType = locreq("lib/chip-types/access-strategy-type.js");


const ResourceType = function(declaration){
	if (typeof declaration === "string"){
		return ChipManager.get_chip("resource_type", declaration);
	} else if (declaration instanceof ResourceType){
		return declaration;
	}
	Chip.call(this, "resource_type", declaration.name);
	this.name = declaration.name;
	this.human_readable_name = declaration.human_readable_name;
	this.summary = declaration.summary;
	this.fields = {};
	this.access_strategy = {
		default: new AccessStrategy("public", {}),
	};
	this._process_declaration(declaration);
};
ResourceType.prototype._process_declaration = function(declaration){
	if (declaration){
		if (declaration.fields){
			for (let i = 0; i < declaration.fields.length; i++){
				if (declaration.fields[i].params){
					if (typeof declaration.fields[i].params !== "object"){
						throw new Errors.ValidationError("In field `" + declaration.fields[i].name + "`: `params` is of wrong type, it should be an object");
					}
				}
			}
			this.add_fields(declaration.fields);
		}
		this.set_access_strategy(declaration.access_strategy);
	}
};
ResourceType.prototype.add_field = function(field_declaration){
	const field_object = new Field(field_declaration, this);
	const field_name = field_object.name;
	if (!this.fields[field_name]){
		this.fields[field_name] = field_object;
	}
	else {
		throw new Errors.DeveloperError("Duplicate field names: '" + field_name + "' in resource: '" + this.name + "'");
	}
};
ResourceType.prototype.add_fields = function(field_declarations_array){
	for (const i in field_declarations_array){
		const declaration = field_declarations_array[i];
		this.add_field(declaration);
	}
};
ResourceType.prototype.has_previous_value_sensitive_fields = function(){
	for (const field_name in this.fields){
		if (this.fields[field_name].has_previous_value_sensitive_methods()){
			return true;
		}
	}
	return false;
};
ResourceType.prototype.get_unknown_field_errors = function(values){
	const validation_errors = {};
	for (const field_name in values){
		if (this.fields[field_name] === undefined){
			validation_errors[field_name] = new Errors.ValidationError(`Unknown field '${field_name}' for resource-type '${this.name}`);
		}
	}
	return validation_errors;
};
ResourceType.prototype.get_missing_values_checker = function(values, assume_delete_value_on_missing_key, old_values){
	const self = this;
	if (assume_delete_value_on_missing_key){
		return function(field_name){
			return self.fields[field_name].required && values[field_name] === undefined;
		};
	} else {
		return function(field_name){
			return self.fields[field_name].required && values[field_name] === undefined && old_values[field_name] === undefined;
		};
	}
};
ResourceType.prototype.get_missing_field_values_errors = function(values, assume_delete_value_on_missing_key, old_values){
	const self = this;
	const errors = {};
	const checker_fn = this.get_missing_values_checker(values, assume_delete_value_on_missing_key, old_values);

	return Promise.filter(Object.keys(self.fields), checker_fn.bind(self))
	.each(function(field_name){
		errors[field_name] = new Errors.ValidationError("Missing value for field '" + field_name + "'");
	}).then(function(){
		return errors;
	});
};
ResourceType.prototype.get_invalid_field_values_errors = function(context, values, old_values){
	const errors = {};
	const promises = [];
	for (const field_name in values){
		if (this.fields[field_name]){
			const value = values[field_name];
			const old_value = old_values? old_values[field_name] : undefined;
			const promise = this.fields[field_name].is_proper_value(context, value, old_value)
			.catch({type: "validation"}, (function(field_name){
				return function(error){
					errors[field_name] = error;
				};
			})(field_name));
			promises.push(promise);
		}
	}
	return Promise.all(promises)
	.then(function(){
		return errors;
	});
};
ResourceType.prototype.validate_field_values = function(context, assume_delete_value_on_missing_key, new_values, old_values){
	const self = this;
	const errors_array = [
		self.get_unknown_field_errors(new_values),
		self.get_missing_field_values_errors(new_values, assume_delete_value_on_missing_key, old_values),
		self.get_invalid_field_values_errors(context, new_values, old_values)
	];

	return Promise.all(errors_array)
	.reduce(merge)
	.then(function(errors){
		const user_errors = {};
		const non_user_errors = {};
		for (const field_name in errors){
			const error = errors[field_name];
			if (error.is_user_fault){
				user_errors[field_name] = error;
			} else {
				non_user_errors[field_name] = error;
			}
		}
		const non_user_errors_amount = Object.keys(non_user_errors).length;
		if (non_user_errors_amount > 0){
			throw non_user_errors[Object.keys(non_user_errors)[0]];
		}
		const user_errors_amount = Object.keys(user_errors).length;
		if (user_errors_amount > 0){
			throw new Errors.ValidationError("There are problems with some of the provided values.", user_errors);
		}
	});
};
ResourceType.prototype.encode_field_values = function(context, body, old_body){
	const promises = {};
	for (const field_name in body){
		const current_value = body[field_name];
		if (current_value === undefined){
			promises[field_name] = null;
		} else {
			const old_value = old_body && old_body[field_name];
			promises[field_name] = this.fields[field_name].encode(context, current_value, old_value);
		}
	}
	return Promise.props(promises);
};
ResourceType.prototype.get_specification = function(with_validators){
	// with_validators:boolean - whether to include validator functions in field descriptions. Warning! If set to true, the output is not serializable in JSON.
	const resource_type_specification = {};
	for (const field_name in this.fields){
		const field_specification = this.fields[field_name].get_specification(with_validators);
		resource_type_specification[field_name] = field_specification;
	}

	const specification = {
		name: this.name,
		human_readable_name: this.human_readable_name,
		summary: this.summary,
		fields: resource_type_specification
	};
	return specification;
};
ResourceType.prototype.get_specification_with_validators = function(){
	return this.get_specification(true);
};
ResourceType.prototype.set_access_strategy = function(strategy_declaration){
	if (typeof strategy_declaration === "string" ||
	strategy_declaration instanceof AccessStrategyType ||
	strategy_declaration instanceof Array){
		this.access_strategy = {
			"default": new AccessStrategy(strategy_declaration)
		};
	} else if (typeof strategy_declaration === "object"){
		for (const action_name in strategy_declaration){
			const access_strategy = strategy_declaration[action_name];
			this.access_strategy[action_name] = new AccessStrategy(access_strategy);
		}
	}
};
ResourceType.prototype.get_access_strategy = function(action_name){
	return this.access_strategy[action_name] || this.access_strategy["default"];
};
ResourceType.prototype.has_large_data_fields = function(){
	for (const i in this.fields){
		const field = this.fields[i];
		if (field.type.handles_large_data){
			return true;
		}
	}
	return false;
};
ResourceType.prototype.is_old_value_sensitive = function(method_name){
	for (const i in this.fields){
		if (this.fields[i].type.is_old_value_sensitive(method_name)){
			return true;
		}
	}
	return false;
};
ResourceType.prototype.decode_values = function(context, values){
	const decoded_values = {};
	for (const key in this.fields){
		const value = values[key];
		const field = this.fields[key];
		if (field === undefined){
			continue;
		}
		decoded_values[key] = field.decode(context, value);
	}
	return Promise.props(decoded_values);
};
ResourceType.prototype._format_decoded_values = function(context, decoded_values, format){

	const formatted_values = clone(decoded_values);
	for (const field_name in formatted_values){
		if (format[field_name]){
			const decoded_value = decoded_values[field_name];
			const field_format =  format[field_name];
			formatted_values[field_name] = this.fields[field_name].format(context, decoded_value, field_format);
		}
	}
	return Promise.props(formatted_values);
};
ResourceType.prototype._get_body = function(context, db_document, format){
	const self = this;
	const decoded_values = this.decode_values(context, db_document.body);
	if (format){
		return decoded_values.then(function(decoded_values){
			return self._format_decoded_values(context, decoded_values, format);
		});
	} else {
		return decoded_values;
	}
};
ResourceType.prototype.get_resource_representation = ResourceType.prototype.decode_db_entry = function(context, db_document, format){
	const representation = {};

	representation.created_context = db_document.created_context;
	representation.last_modified_context = db_document.last_modified_context;
	representation.id = db_document.sealious_id;
	representation.type_name = this.name;
	representation.body = this._get_body(context, db_document, format);

	return Promise.props(representation).then(function(res){
		return res;
	});
};

ResourceType.prototype.check_if_action_is_allowed = function(context, action_name, resource_representation){
	const access_strategy = this.get_access_strategy(action_name);

	return access_strategy.check(context, resource_representation)
	.then(function(results){
		return results;
	});
};

module.exports = ResourceType;
