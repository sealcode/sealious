var Promise = require("bluebird");
var merge = require("merge");

/**
 * Stores field type metadata, as well as validation methods
 * @class
 */
function FieldType(name){
	this.longid = longid;
	Sealious.ChipManager.add_chip("resource_type", this.name, this, parent_module_path);
}

FieldType.prototype =  new function(){
	/**
	 * Whether a given value can be stored in this field type instance
	 * @memberOf  FieldType
	 * @abstract	
	 * @param {any} value value of this variable will be tested for compatibility with this field
	 * @return {Promise}
	 */
	this.isProperValue = function(value){
		return new Promise(function(resolve, reject){
			resolve(value);
		});
	}

	this.encode = function(value_in_code){
		return new Promise(function(resolve, reject){
			resolve(value_in_code);
		})
	}

	this.decode = function(value_in_database){
		return new Promise(function(resolve, reject){
			resolve(value_in_database);
		})
	}

	this.setParams = function(param_map){
		if(this.params==undefined){
			this.params = param_map;
		}
		this.params = merge(this.params, param_map);
	}
}

FieldType.is_a_constructor = true;

FieldType.type_name = "field_type";

module.exports = FieldType;