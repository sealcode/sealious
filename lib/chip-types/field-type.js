var Promise = require("bluebird");

/**
 * Stores field type metadata, as well as validation methods
 * @class
 */
function FieldType(){

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
		console.log("field-type.js foka")
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
}

module.exports = FieldType;