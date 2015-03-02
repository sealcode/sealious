var Promise = require("bluebird");

var Reference = function(resource_type){
 	this.resource_type = resource_type;
 }

Reference.prototype.isProperValue = function(resource_id, dispatcher){
	dispatcher.idExists(resource_id, this.resource_type, function(bool){
		return bool;
	})
}

module.exports = Reference;