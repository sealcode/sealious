var Sealious = require("../main.js");
var Promise = require("bluebird");

var merge = require("merge");

var Chip = require("./chip.js");
var ResourceTypeField = require("./resource-type-field.js");

var ResourceType = function(declaration){
	if (typeof declaration != "object") {
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
		if (declaration) {
			if (declaration.fields) {
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
		for (var i in field_declarations_array) {
			var declaration = field_declarations_array[i];
			this.add_field(declaration);
		}
	}

	this.has_previous_value_sensitive_fields = function(){
		for (var field_name in this.fields) {
			if (this.fields[field_name].has_previous_value_sensitive_methods()) {
				return true;
			}
		}
		return false;
	}

	function ensure_no_unknown_fields (values) {
		var validation_errors = {};
		for (var field_name in values) {

			if (this.fields[field_name] == undefined) {
				validation_errors[field_name] = "unknown_field";
			}
		}
		return validation_errors;
	}



	this.extend_with_missing_field_values_errors = function(current_validation_errors, values){
		for (var i in this.fields) {
			var field = this.fields[i];
			if (field.required && values[field.name] == undefined) {
				current_validation_errors[field.name] = new Sealious.Errors.ValidationError("Missing value for field `" + field.get_nice_name() + "`");
			}
		}
	}

	this.validate_field_values = function(context, check_missing, values, old_values){
		var self = this;
		var existing_field_names = Object.keys(this.fields);
		var validation_errors = {};

		var validation_tasks = [];

		for (var key in values) {
			var value = values[key];
			if (existing_field_names.indexOf(key)==-1){
				validation_errors[key] = new Sealious.Errors.ValidationError("Wrong field name: '" + key +"'");
			} else {
				var old_value = old_values ? old_values[key] : undefined;
				var validation_promise = self.fields[key].check_value(context, value, old_value).catch((function(key){
					return function(error){
						validation_errors[key] = error;
						return Promise.resolve();
					}
				})(key));				
			}
			validation_tasks.push(validation_promise);
		}

		return Promise.all(validation_tasks)
			.then(function(){
				self.extend_with_missing_field_values_errors(validation_errors, values);
				var has_errors = false;
				for (var key in validation_errors) {
					//validation_errors is not an empty object
					has_errors = true;
					var error = validation_errors[key];
					if (error.is_user_fault) {
						validation_errors[key] = error.message;
					} else {
						return Promise.reject(error);
					}
				}
				if (has_errors) {
					return Promise.reject(new Sealious.Errors.ValidationError("There are problems with some of the provided values.", validation_errors));
				} else {
					//validation_errors is empty, resolve
					return Promise.resolve();
				}
			});
	}

	this.encode_field_values = function(context, body, old_body){
		var promises = {};
		for (var field_name in body) {
			var current_value = body[field_name];
			var old_value = old_body && old_body[field_name];
			promises[field_name] = this.fields[field_name].encode_value(context, current_value, old_value);
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
		if (typeof strategy_declaration == "string") {
			access_strategy_name = strategy_declaration;
			this.access_strategy = {
				"default": Sealious.ChipManager.get_chip("access_strategy", access_strategy_name),
			}
		} else if (typeof strategy_declaration == "object") {
			for (var action_name in strategy_declaration) {
				var access_strategy = Sealious.ChipManager.get_chip("access_strategy", strategy_declaration[action_name]);
				this.access_strategy[action_name] = access_strategy;
			}
		}
	}

	this.get_access_strategy = function(action){
		return this.access_strategy[action] || this.access_strategy["default"];
	}

	this.has_large_data_fields = function(){
		for (var i in this.fields) {
			var field = this.fields[i];
			if (field.type.handles_large_data) {
				return true;
			}
		}
		return false;
	}

	this.is_old_value_sensitive = function(method_name){
		for (var i in this.fields) {
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
			if (field == undefined) continue;
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


}

module.exports = ResourceType;