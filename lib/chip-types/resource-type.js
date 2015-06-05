var Promise = require("bluebird");

var merge = require("merge");

var Chip = require("./chip.js");
var ResourceTypeField = require("./resource-type-field.js");

var ResourceType = function(parent_module_path, name, declaration){
	Chip.call(this, parent_module_path, true, "resource_type", name);
	this.name = name;
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
		var field_object = new ResourceTypeField(field_declaration, this);
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

	this.validate_field_values = function(context, check_missing, values, old_values){
		var that = this;
		var validation_errors = {};
		validation_errors = merge(validation_errors, ensure_no_unknown_fields.call(that, values));
		if(check_missing){
			validation_errors = merge(validation_errors, ensure_no_missing_required_fields.call(that, values));
		}
		var promises = {};
		for(var key in values){
			if(validation_errors[key]===undefined){
				var _arguments;
				var field = that.keys[key];
				var value = values[key];
				var old_value = (old_values && old_values.body && old_values.body[key]) || undefined;
				var validation_result = field.check_value(context, value, old_value);
				if(validation_result && validation_result.reflect){
					promises[key] = validation_result.reflect();					
				}else{
					promises[key] = validation_result;
				}
			}
		}

		var error_message = "There are problems with some of the provided values";//TODO: ładnie generować tekst podsumowujący problem z inputem


		return Promise.props(promises)
		.then(function(validation_results){
			for(var key in validation_results){
				var result = validation_results[key];
				if(result==undefined) continue;
				if(typeof result=="boolean"){
					if(result.value===false){
						validation_errors[key] = "bad_value";
					}
				}else if(typeof result=="string"){
					validation_errors[key] = string;
				}else if(typeof result=="object"){
					if(result.isRejected){ //checking if result is an instance of a PromiseInspection
						if(result.isRejected()){
							validation_errors[key] = result.reason();
						}
					}else if(result instanceof Error){
						if(result.type=="validation_error"){
							validation_errors[key]  = result;
						}else{
							validation_errors[key] = {error_message: result.status_message, data: result.data};							
						}
					}
				}
			}
			if(Object.keys(validation_errors).length>0){
				throw new Sealious.Errors.ValidationError(error_message, {invalid_fields: validation_errors});
			}else{
				return Promise.resolve();
			}
		}.bind(this))
	}

	this.encode_field_values = function(context, body, old_body){
		var promises = {};
		for(var field_name in body){
			var current_value = body[field_name];
			var old_value = old_body && old_body[field_name];
			promises[field_name] = this.keys[field_name].encode_value(context, current_value, old_value);
		}
		return Promise.props(promises);
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


	this.has_large_data_fields = function(){
		for(var i in this.fields){
			var field = this.fields[i];
			if(field.type.handles_large_data){
				return true;
			}
		}
		return false;
	}

	this.is_old_value_sensitive = function(){
		for (var i in this.fields){
			if (this.fields[i].type.old_value_sensitive){
				return true;
			}
		}
		return false;
	}

	this.decode_values = function(context, values){
		var decoded_values = {};
		for(var key in this.keys){
			var value = values[key];
			var field = this.fields[key];
			if(field==undefined) continue;
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
				body: decoded_body
			}
			return Promise.resolve(ret);
		});
	}


}

ResourceType.is_a_constructor = false;

module.exports = ResourceType;