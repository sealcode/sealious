var Promise = require("bluebird");

var Reference = function(declaration){
	this.validate_declaration(declaration);

	this.name = declaration.name;
	this.required = declaration.required===undefined? false : true;
	this.allowed_types = declaration.allowed_types || [];
}

Reference.prototype = new function(){

	this.validate_declaration = function(declaration){
		var required_declaration_fields = {
			"name": "string", 
			"allowed_types": "array"
		}
		for(var attribute_name in required_declaration_fields){
			if(declaration[attribute_name]===undefined){
				throw new Sealious.Errors.DeveloperError("Missing `" + attribute_name + "` attribute in reference declaration.");
			}
		}
		for(var i in declaration.allowed_types){
			var type_name = declaration.allowed_types[i];
			if(!Sealious.ChipManager.chip_exists("resource_type", type_name)){
				throw new Sealious.Errors.DeveloperError("Unknown allowed type in declaration of reference: " + type_name);
			}
		}
	}

	this.isProperValue = function(value){
		return new Promise(function(resolve, reject){
			if(typeof value == "object"){
				//validate object's values as values for new resource
				var type = value.type;
				if(type===undefined){
					reject("Reference resource type undefined. `type` attribute should be set to one of these values: " + this.allowed_types.join(", ") + ".");
				}else if(this.allowed_types.indexOf(type)==-1){
					reject("Incorrect reference resource type: `" +  type + "`. Allowed resource types for this reference are:" + this.allowed_types.join(", ") + "."); 
				}else{
					var resource_type_object = Sealious.ChipManager.get_chip("resource_type", type);
					resource_type_object.validate_field_values(value.data).then(function(){
						console.log("resolved!");
						resolve();
					}).catch(function(error){
						console.log("rejected because of ", error);
						var response = {};
						response[this.name] = error.data.invalid_fields;
						reject(response);
					}.bind(this));
				}
			}else{
				//value is uid. Check if it is proper
				
			}
		}.bind(this));
	}

	this.encode_value = function(value_in_code){
		//decide whether to create a new resource (if so, do create it). Resolve with id of referenced resource.
		if(value_in_code instanceof Object){
			return //dispatcher.resource_manager.create_resource(value_in_code.type, value_in_code.data);
		}
	}

}

module.exports = Reference;