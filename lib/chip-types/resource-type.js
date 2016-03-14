var Sealious = require("sealious");
var Promise = require("bluebird");

var merge = require("merge");
var clone = require("clone");

var Chip = require("./chip.js");
var Field = require("./field.js");
var AccessStrategy = require("./access-strategy.js");

var ResourceType = function(declaration){
	if (typeof declaration === "string"){
		return Sealious.ChipManager.get_chip("resource_type", declaration);
	} else if (declaration instanceof ResourceType){
		return declaration;
	}
	Chip.call(this, "resource_type", declaration.name);
	this.name = declaration.name;
	this.human_readable_name = declaration.human_readable_name;
	this.summary = declaration.summary;
	this.fields = {};
	this.access_strategy = {
		default: new AccessStrategy("public", {})
	};
	this._process_declaration(declaration);
}

ResourceType.prototype = new function(){

	this._process_declaration = function(declaration){
		if (declaration){
			if (declaration.fields){
				for (var i = 0; i < declaration.fields.length; i++){
					if (declaration.fields[i].params) {
						if (typeof declaration.fields[i].params !== "object") {
							throw new Sealious.Errors.ValidationError("In field `" + declaration.fields[i].name + "`: `params` is of wrong type, it should be an object")
						}
					}
				}
				this.add_fields(declaration.fields);
			}
			this.set_access_strategy(declaration.access_strategy);
		}
	}

	this.add_field = function(field_declaration){
		var field_object = new Field(field_declaration, this);
		var field_name = field_object.name;
		if (!this.fields[field_name]) {
			this.fields[field_name] = field_object;
		}
		else {
			throw new Sealious.Errors.DeveloperError("Duplicate field names: '" + field_name + "' in resource: '" + this.name + "'" );
		}
	}

	this.add_fields = function(field_declarations_array){
		for (var i in field_declarations_array){
			var declaration = field_declarations_array[i];
			this.add_field(declaration);
		}
	}

	this.has_previous_value_sensitive_fields = function(){
		for (var field_name in this.fields){
			if (this.fields[field_name].has_previous_value_sensitive_methods()){
				return true;
			}
		}
		return false;
	}

	this.get_unknown_field_errors = function(values){
		var validation_errors = {};
		for (var field_name in values){
			if (this.fields[field_name] === undefined) {
				validation_errors[field_name] = new Sealious.Errors.ValidationError(`Unknown field '${field_name}' for resource-type '${this.name}`);
			}
		}
		return validation_errors;
	}

	this.get_missing_values_checker = function(values, assume_delete_value_on_missing_key, old_values){
		var self = this;
		if (assume_delete_value_on_missing_key){
			return function(field_name){
				return self.fields[field_name].required && values[field_name] === undefined
			};
		} else {
			return function(field_name){
				return self.fields[field_name].required && values[field_name] === undefined && old_values[field_name] === undefined;
			}
		}
	}

	this.get_missing_field_values_errors = function(values, assume_delete_value_on_missing_key, old_values){
		var self = this;
		var errors = {};
		var checker_fn = this.get_missing_values_checker(values, assume_delete_value_on_missing_key, old_values)

		return Promise.filter(Object.keys(self.fields), checker_fn.bind(self))
		.each(function(field_name){
			errors[field_name] = new Sealious.Errors.ValidationError("Missing value for field `" + self.fields[field_name].get_nice_name() + "`");
		}).then(function(){
			return errors;
		})
	}

	this.get_invalid_field_values_errors = function(context, values, old_values){
		var errors = {};
		var promises = [];
		for (var field_name in values){
			if (this.fields[field_name]){
				var value = values[field_name];
				var old_value = old_values? old_values[field_name] : undefined;
				var promise = this.fields[field_name].is_proper_value(context, value, old_value)
				.catch({type: "validation"}, (function(field_name){
					return function(error){
						errors[field_name] = error;
					}
				})(field_name)
				);
				promises.push(promise);
			}
		}
		return Promise.all(promises)
		.then(function(){
			return errors;
		})
	}

	this.validate_field_values = function(context, assume_delete_value_on_missing_key, new_values, old_values){
		var self = this;
		var validation_errors = {};
		var errors_array = [
		self.get_unknown_field_errors(new_values),
		self.get_missing_field_values_errors(new_values, assume_delete_value_on_missing_key, old_values),
		self.get_invalid_field_values_errors(context, new_values, old_values)
		];

		return Promise.all(errors_array)
		.reduce(merge)
		.then(function(errors){
			var user_errors = {};
			var non_user_errors = {};
			for (var field_name in errors){
				var error = errors[field_name];
				if (error.is_user_fault){
					user_errors[field_name] = error;
				} else {
					non_user_errors[field_name] = error;
				}
			}
			var non_user_errors_amount = Object.keys(non_user_errors).length;
			if (non_user_errors_amount > 0){
				throw non_user_errors[Object.keys(non_user_errors)[0]];
			}
			var user_errors_amount = Object.keys(user_errors).length;
			if (user_errors_amount > 0){
				throw new Sealious.Errors.ValidationError("There are problems with some of the provided values.", user_errors);
			}
		})
	}

	this.encode_field_values = function(context, body, old_body){
		var promises = {};
		for (var field_name in body){
			var current_value = body[field_name];
			if (current_value === undefined){
				promises[field_name] = null;
			} else {
				var old_value = old_body && old_body[field_name];
				promises[field_name] = this.fields[field_name].encode(context, current_value, old_value);
			}
		}
		return Promise.props(promises);
	}

	this.get_specification = function(with_validators){
		//with_validators:boolean - whether to include validator functions in field descriptions. Warning! If set to true, the output is not serializable in JSON.
		var resource_type_specification = {};
		for (var field_name in this.fields){
			var field_specification = this.fields[field_name].get_specification(with_validators);
			resource_type_specification[field_name] = field_specification;
		}

		var specification = {
			name: this.name,
			human_readable_name: this.human_readable_name,
			summary: this.summary,
			fields: resource_type_specification
		};
		return specification;
	}

	this.get_specification_with_validators = function(){
		return this.get_specification(true);
	}

	this.set_access_strategy = function(strategy_declaration){
		if (typeof strategy_declaration === "string" ||
			strategy_declaration instanceof Sealious.AccessStrategyType ||
			strategy_declaration instanceof Array){
			this.access_strategy = {
				"default": new AccessStrategy(strategy_declaration)
			}
		} else if (typeof strategy_declaration === "object"){
			for (var action_name in strategy_declaration){
				var access_strategy = strategy_declaration[action_name];
				this.access_strategy[action_name] = new AccessStrategy(access_strategy);
			}
		}
	}

	this.get_access_strategy = function(action_name){
		return this.access_strategy[action_name] || this.access_strategy["default"];
	}

	this.has_large_data_fields = function(){
		for (var i in this.fields){
			var field = this.fields[i];
			if (field.type.handles_large_data){
				return true;
			}
		}
		return false;
	}

	this.is_old_value_sensitive = function(method_name){
		for (var i in this.fields){
			if (this.fields[i].type.is_old_value_sensitive(method_name)) {
				return true;
			}
		}
		return false;
	}

	this.decode_values = function(context, values){
		var decoded_values = {};
		for (var key in this.fields) {
			var value = values[key];
			var field = this.fields[key];
			if (field === undefined){
				continue;
			}
			decoded_values[key] = field.decode(context, value);
		}
		return Promise.props(decoded_values);
	}

	this._format_decoded_values = function(context, decoded_values, format){

		var formatted_values = clone(decoded_values);
		for (var field_name in formatted_values){
			if (format[field_name]){
				var decoded_value = decoded_values[field_name];
				var field_format =  format[field_name];
				formatted_values[field_name] = this.fields[field_name].format(context, decoded_value, field_format)
			}
		}
		return Promise.props(formatted_values);
	}

	this._get_body = function(context, db_document, format){
		var self = this;
		var decoded_values = this.decode_values(context, db_document.body);
		if (format){
			return decoded_values.then(function(decoded_values){
				return self._format_decoded_values(context, decoded_values, format);
			})
		} else {
			return decoded_values;
		}

	}

	this.get_resource_representation = this.decode_db_entry = function(context, db_document, format){
		var representation = {};

		representation.created_context = db_document.created_context;
		representation.last_modified_context = db_document.last_modified_context;
		representation.id = db_document.sealious_id;
		representation.type_name = this.name;
		representation.body = this._get_body(context, db_document, format);

		return Promise.props(representation).then(function(res){
			return res;
		})
	}

	this.check_if_action_is_allowed = function(context, action_name, resource_representation){
		var access_strategy = this.get_access_strategy(action_name);


		return access_strategy.check(context, resource_representation)
		.then(function(results){
			return results;
		})
	}
}

module.exports = ResourceType;
