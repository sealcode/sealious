var Promise = require("bluebird");
var ResourceTypeField = require("./resource-type-field.js");
var merge = require("merge");

ChipManager = null;

var ResourceType = function(longid, ChipManager_reference){
	this.id = longid;
	this.longid = longid;
	this.name = longid;
	this.fields = {};
	ChipManager = ChipManager_reference;//dirty dirty hack to avoid circular dependency
}

ResourceType.prototype = new function(){

	this.add_field = function(field_declaration){
		var field_object = new ResourceTypeField(field_declaration, ChipManager);
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
		return new Promise(function(resolve, reject){
			for(var i in that.fields){
				var field = that.fields[i];
				if(field.required && !values[field.name]){
					reject(new Error("required field missing:" + field.name))
					return;
				}
			}
			var promise_array = [];
			for(var field_name in values){
				var temp_promise = that.fields[field_name].isProperValue(values[field_name]);
				promise_array.push(temp_promise);
			}

			Promise.all(promise_array)
			.then(function(result){
				resolve();
			})
			.catch(function(error){
				reject(error);
			});
			
		})
	}

	this.encode_field_values = function(body){
		console.log("###########encoding body:", body);
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

}

ResourceType.is_a_constructor = false;

module.exports = ResourceType;