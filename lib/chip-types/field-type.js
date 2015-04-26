var Promise = require("bluebird");
var merge = require("merge");

/**
 * Stores field type metadata, as well as validation methods
 * @class
 */
function FieldType(longid, declaration){
	this.longid = longid;
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

	this.validate_declaration = function(declaration){
		return new Promise(function(resolve, reject){
			resolve();
		});
	}

	this.encode = function(value_in_code){
		return new Promise(function(resolve, reject){
			resolve(value_in_code);
		})
	}

	this.decode = function(value_in_database, formatting_options){
		return new Promise(function(resolve, reject){
			resolve(value_in_database);
		})
	}

	this.set_params = function(param_map){
		if(this.params==undefined){
			this.params = param_map;
		}
		this.params = merge(this.params, param_map);
	}
}

FieldType.is_a_constructor = true;

FieldType.type_name = "field_type";

module.exports = FieldType;