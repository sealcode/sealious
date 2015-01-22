var Promise = require("bluebird");
var FieldType= require("prometheus-resource").FieldType;
var ResourceTypeManager = require("prometheus-resource").ResourceTypeManager;
var ResourceManager = require("prometheus-resource").ResourceManager;



/**
 * A field type. Connects resource type `from_type_name` with resource type `to_type_name`
 * @memberOf field-type-manager
 * @this {Association}
 * @param {string} from_type_name
 * @param {string} to_type_name
 * @class
 * @extends FieldType
 * @inner
 */
 var Association = function(arguments){
 	this.from_type_name = arguments.from_type_name;
 	this.to_type_name = arguments.to_type_name;
 	//console.log("to_type_name:", this.to_type_name);
 }

/**
 * implements @link FieldType~isProperValue
 * @override
 * @this {Association}
 * @param  {any}  value
 * @return {Promise}
 */

 Association.prototype = Object.create(FieldType.prototype)

 Association.prototype.isProperValue = function(value){
 	var that = this;
 	//console.log("association.isProperValue");
 	return new Promise(function(resolve, reject){
 		var id = parseInt(value);
 		if(isNaN(id)){
 			reject(value + " is not a number");
 		}
 		ResourceManager.idExists(value, that.to_type_name, function(exists){
 			if(exists){
 				resolve();
 			}else{
 				reject(that.to_type_name + " of id " + value + " does not exist");
 			}
 		}); 		
 	})
 }

 Association.prototype.encode = function(value_in_code){
 	return new Promise(function(resolve, reject){
 		switch(typeof value_in_code){
 			case "string":
 				var id = parseInt(value_in_code);
 				if(isNaN(id)){
 					reject();
 				}else{
 					resolve(id);
 				}
 				break;
 			case "number":
 				resolve(value_in_code);
 				break;
			case "object":
				resolve(value_in_code.prometheus_id);
				break;
			default:
				//console.log("reject");
				reject();
				break;
 		}
 	});
 }

 Association.prototype.decode = function(value_in_database){
 	return ResourceManager.getResourceByID(value_in_database);
 }

module.exports.field_type_name = "association";
module.exports.constructor = Association;