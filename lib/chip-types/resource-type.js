var Promise = require("bluebird");
var ResourceTypeField = require("./resource-type-field.js");
var merge = require("merge");

var ResourceType = function(parent_module_path, name){
	this.id = name;
	this.longid = "resource_type" + name;
	this.name = name;
	this.fields = {};
	Sealious.ChipManager.add_chip("resource_type", this.name, this, parent_module_path);
}

ResourceType.prototype = new function(){

	this.add_field = function(field_declaration){
		var field_object = new ResourceTypeField(field_declaration);
		var field_name = field_object.name;
		if(!this.fields[field_name]){
			this.fields[field_name] = field_object;
		}
	} 

	this.add_fields = function(field_declarations_array){
		for(var i in field_declarations_array){
			var declaration = field_declarations_array[i];
			this.add_field(declaration);
		}
	}

	this.validate_field_values = function(values){
		var that = this;
		var validation_errors = {};
		var found_errors = false;
		return new Promise(function(resolve, reject){
			for(var field_name in values){
				//checking for unknown fields
				if(that.fields[field_name]==undefined){
					//throw new Sealious.Errors.ValidationError("unknown field: " + field_name); //~ 
					found_errors = true;
					validation_errors[field_name] = "unknown_field";
				}
			}
			for(var i in that.fields){
				var field = that.fields[i];
				if(field.required && !values[field.name]){
					//reject(new Sealious.Errors.ValidationError("required field missing:" + field.name)) //~
					found_errors = true;
					validation_errors[field.name] = "missing_value";
				}
			}
			var promise_array = [];
			for(var field_name in values){
				if(validation_errors[field_name]===undefined){
					var temp_promise = that.fields[field_name].isProperValue(values[field_name]);
					promise_array.push(temp_promise);					
				}
			}

			var error_message = "There are problems with some of the provided values";//TODO: ładnie generować tekst podsumowujący problem z inputem

			Promise.all(promise_array)
			.then(function(result){
				if(found_errors){
					throw new Sealious.Errors.ValidationError(error_message, validation_errors);
				}else{
					resolve();					
				}
			})
			.catch(function(error){
				validation_errors = merge(validation_errors, error);
				reject(new Sealious.Errors.ValidationError(error_message, validation_errors));
			});
			
		})
	}

	this.encode_field_values = function(body){
		var promises = [];
		for(var field_name in body){
			var current_value = body[field_name];
			promises.push(this.fields[field_name].encode_value(current_value, true));
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

}

ResourceType.is_a_constructor = false;

module.exports = ResourceType;