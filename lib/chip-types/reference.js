var ChipManager = require("./chip-manager.js");

var Promise = require("bluebird");

var Reference = function(declaration){
	this.validate_declaration(declaration);

	this.name = decalration.name;
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
			if(!ChipManager.chip_exists("resource_type", type_name)){
				throw new SealiousErrors.DeveloperError("Unknown allowed type in declaration of reference: " + type_name);
			}
		}
	}

	this.isProperValue = function(value){
		return new Promise(function(resolve, reject){
			if(typeof value == "object"){
				//validate object's values as values for new resource
				var type = object.type;
				if(type===undefined){
					reject("Reference resource type undefined. `type` attribute should be set to one of these values: ", this.allowed_types(", ") + ".");
				}else if(this.allowed_types.indexOf(type)==-1){
					reject("Incorrect reference resource type: `" +  type + "`. Allowed resource types for this reference are:" + this.allowed_types(", ") + "."); 
				}else{
					//correct resource type name, let's check if provided values are proper
				}
			}else{
				//value is uid. Check if it is proper
				
			}
		});
	}

}

module.exports = Reference;