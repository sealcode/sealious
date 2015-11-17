var Sealious = require("sealious");
var Promise = require("bluebird");

var merge = require("merge");

var Chip = require("./chip.js");
var ResourceTypeField = require("./resource-type-field.js");

var ResourceType = function(declaration){
	if (typeof declaration != "object"){
		throw new Sealious.Errors.DeveloperError("Tried to create a resource-type without a declaration");
	}
	Chip.call(this, true, "resource_type", declaration.name);
	this.name = declaration.name;
	this.human_readable_name = declaration.human_readable_name;
	this.summary = declaration.summary;
	this.fields = {};
	this.references = {};
	this.access_strategy = {
		default: Sealious.ChipManager.get_chip("access_strategy", "public")
	};
	this._process_declaration(declaration);
}

ResourceType.prototype = new function(){

	this._process_declaration = function(declaration){
		if (declaration){
			if (declaration.fields){
				this.add_fields(declaration.fields);
			}
			this.set_access_strategy(declaration.access_strategy);
		}
	}

	this.add_field = function(field_declaration){
		var field_object = new ResourceTypeField(field_declaration, this);
		var field_name = field_object.name;
		if (!this.fields[field_name]) {
			this.fields[field_name] = field_object;
			this.fields[field_name] = field_object;
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
			if (this.fields[field_name] == undefined) {
				validation_errors[field_name] = "unknown_field";
			}
		}
		return validation_errors;
	}

	this.get_missing_values_checker = function(values, assume_delete_value_on_missing_key, old_values_or_getter){
		var self = this;
		if (assume_delete_value_on_missing_key){
			return this.load_item_from_cached_getter(old_values_or_getter)
			.then(function(old_values){
				return function(field_name){
					return self.fields[field_name].required && values[field_name]==undefined && old_values[field_name]==undefined
				}
			})
		} else {
			return function(field_name){
				return self.fields[field_name].required && values[field.name]==undefined
			}
		}
	}

	this.get_missing_field_values_errors = function(values, assume_delete_value_on_missing_key, old_values_or_getter){
		var self = this;
		var errors = {};
		return this.get_missing_values_checker(values, assume_delete_value_on_missing_key, old_values_or_getter)
		.then(function(checker_fn){
			return Promise.filter(Object.keys(self.fields), checker_fn.bind(self));
		}).each(function(field_name){
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
				var promise = this.fields[field_name].check_value(context, value, old_value)
				.catch((function(field_name){
					return function(error){
						if (error.type=="validation"){
							errors[field_name] = error;
						} else {
							throw error;
						}
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

	this.load_item_from_cached_getter = function(item_or_getter){
		if (typeof item_or_getter == "function"){
			return Promise.method(item_or_getter)();
		} else if (item_or_getter==undefined){
			return Promise.resolve({});
		} else {
			return Promise.resolve(item_or_getter);
		}		
	}

	this.load_item_if_necessary = function(item_or_getter){
		if (this.is_old_value_sensitive()){
			return this.load_item_from_cached_getter(item_or_getter);
		} else {
			return Promise.resolve(undefined);
		}
	}

	this.validate_field_values = function(context, assume_delete_value_on_missing_key, new_values, old_values_or_getter){
		var self = this;
		var validation_errors = {};
		return this.load_item_if_necessary(old_values_or_getter)
		.then(function(old_values){
			var errors_array = [
				self.get_unknown_field_errors(new_values),
				self.get_missing_field_values_errors(new_values, assume_delete_value_on_missing_key, old_values_or_getter),
				self.get_invalid_field_values_errors(context, new_values, old_values)
			];
			return Promise.all(errors_array);
		})
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
			if (non_user_errors_amount>0){
				throw non_user_errors[Object.keys(non_user_errors)[0]];
			}
			var user_errors_amount = Object.keys(user_errors).length;
			if (user_errors_amount>0){
				throw new Sealious.Errors.ValidationError("There are problems with some of the provided values.", user_errors);
			}
		})
	}

	this.encode_field_values = function(context, body, old_body){
		var promises = {};
		for (var field_name in body){
			var current_value = body[field_name];
			if (current_value===undefined){
				promises[field_name] = null;
			} else {
				var old_value = old_body && old_body[field_name];
				promises[field_name] = this.fields[field_name].encode_value(context, current_value, old_value);				
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
		if (typeof strategy_declaration == "string"){
			access_strategy_name = strategy_declaration;					
			this.access_strategy = {
				"default": Sealious.ChipManager.get_chip("access_strategy", access_strategy_name),
			}
		} else if (typeof strategy_declaration =="object"){
			for (var action_name in strategy_declaration){
				var access_strategy = Sealious.ChipManager.get_chip("access_strategy", strategy_declaration[action_name]);
				this.access_strategy[action_name] = access_strategy;
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
			if (field==undefined) continue;
			decoded_values[key] = field.decode_value(context, value);
		}
		return Promise.props(decoded_values);
	}

	this.decode_db_entry = function(context, db_document){
		var id = db_document.sealious_id;
		var original_body = db_document.body;

		return this.decode_values(context, original_body)
		.then(function(decoded_body){
			var ret = {
				id: id,
				type: db_document.type,
				body: decoded_body,
				created_context: db_document.created_context,
				last_modified_context: db_document.last_modified_context,
			}
			return Promise.resolve(ret);
		});
	}

	this.check_if_action_is_allowed = function(context, action_name, item_or_getter){
		var access_strategy = this.get_access_strategy(action_name)
		return access_strategy.check(context, item_or_getter);
	}
}

module.exports = ResourceType;