var Promise = require("bluebird");

var merge = require("merge");

var Chip = require("./chip.js");
var ResourceTypeField = require("./resource-type-field.js");

var ResourceType = function(parent_module_path, name, declaration){
	Chip.call(this, parent_module_path, true, "resource_type", name);
	this.fields = {};
	this.references = {};
	this.keys = {};
	this.access_strategy = {
		default: Sealious.ChipManager.get_chip("access_strategy", "public")
	};
	this._process_declaration(declaration);
}

ResourceType.prototype = new function(){

	this._process_declaration = function(declaration){
		if(declaration){
			if(declaration.fields){
				this.add_fields(declaration.fields);
			}
			this.set_access_strategy(declaration.access_strategy);
		}
	}

	this.add_field = function(field_declaration){
		var field_object = new ResourceTypeField(field_declaration);
		var field_name = field_object.name;
		if(!this.keys[field_name]){
			this.fields[field_name] = field_object;
			this.keys[field_name] = field_object;
		}
	} 

	this.add_fields = function(field_declarations_array){
		for(var i in field_declarations_array){
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

	function ensure_no_unknown_fields(values){
		var validation_errors = {};
		console.log("ensure no unknown field",values)
		for(var field_name in values){

			if(this.keys[field_name]==undefined){
				validation_errors[field_name] = "unknown_field";
			}
		}
		return validation_errors;
	}



	function ensure_no_missing_required_fields(values){
		var validation_errors = {};
		for(var i in this.keys){
			var field = this.keys[i];
			if(field.required && !values[field.name]){
				validation_errors[field.name] = "missing_value";
			}
		}
		return validation_errors;
	}

	this.validate_field_values = function(context, values){
		console.log("resource type values", values)
		var that = this;
		var validation_errors = {};
		validation_errors = merge(validation_errors, ensure_no_unknown_fields.call(that, values));
		validation_errors = merge(validation_errors, ensure_no_missing_required_fields.call(that, values));
		var promise_array = [];
		for(var key in values){
			console.log("values[key]",values[key])
			console.log("validation_errors[key]", validation_errors[key])
			if(validation_errors[key]===undefined){

				var _arguments;
				var field = that.keys[key];
				var value = values[key];
				var validation_promise = field.check_value(context, value);
				promise_array.push(validation_promise);					
			}
		}


		var error_message = "There are problems with some of the provided values";//TODO: ładnie generować tekst podsumowujący problem z inputem

		return Promise.all(promise_array)
		.then(function(result){
			if(Object.keys(validation_errors).length>0){
				throw new Sealious.Errors.ValidationError(error_message, {invalid_fields: validation_errors});
			}else{
				return Promise.resolve();					
			}
		})
		.catch(function(errors){
			if(!(errors instanceof Error)){
				for(var i in errors){
					if(!(typeof errors[i]=="string") && errors.is_user_fault===false){
						throw errors[i];
					}
				}				
			}
			validation_errors = merge(validation_errors, errors);
			return Promise.reject(new Sealious.Errors.ValidationError(error_message, {invalid_fields: validation_errors}));					
		});
	}

	this.encode_field_values = function(context, body){
		var promises = [];
		for(var field_name in body){
			var current_value = body[field_name];
			promises.push(this.keys[field_name].encode_value(context, current_value, true));
		}
		return Promise.all(promises).then(function(responses){
			return new Promise(function(resolve, reject){
				resolve(merge.apply(merge, responses));
			})
		});
	}

	this.get_signature = function(){
		var resource_type_signature = [];
		for(var field_name in this.fields){
			var field_signature = this.fields[field_name].get_signature();
			resource_type_signature.push(field_signature);
		}
		return resource_type_signature;
	}

	this.set_access_strategy = function(strategy_declaration){
		if(typeof strategy_declaration == "string"){
			access_strategy_name = strategy_declaration;					
			this.access_strategy = {
				"default": Sealious.ChipManager.get_chip("access_strategy", access_strategy_name),
			}
		}else if(typeof strategy_declaration =="object"){
			for(var action_name in strategy_declaration){
				var access_strategy = Sealious.ChipManager.get_chip("access_strategy", strategy_declaration[action_name]);
				this.access_strategy[action_name] = access_strategy;
			}
		}
	}

	this.get_access_strategy = function(action){
		return this.access_strategy[action] || this.access_strategy["default"];
	}

}

ResourceType.is_a_constructor = false;

module.exports = ResourceType;