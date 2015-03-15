var Promise = require("bluebird");

module.exports = function(field_type_int){

	field_type_int.prototype.encode = function(value_in_code){
		//console.log("!!! encoding int!!");
		return new Promise(function(resolve, reject){
			resolve(parseInt(value_in_code));
		})
	}
	
}