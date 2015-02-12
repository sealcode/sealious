var Promise = require("bluebird");

var Reference = function(resource_type){
 	this.resource_type = resource_type;
 }

Refernce.prototype.isProperValue = function(resource_id, dispatcher){
	//should be this, or should I create that? and also does dispatcher have function idExists or some prefix is neccessary?
	dispatcher.idExists(resource_id, this.resource_type, function(bool){
		return bool;
	})

/*
	var callback = function(bool){
		return bool;
	}
	ResourceManager.idExists(resource_id, this.resource_type, callback());
*/

}

module.exports = Reference;