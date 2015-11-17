var Sealious = require("sealious");

var ResourceCollection = require("./resource-collection-subject.js");

var RootSubject = function(){

	this.resource_collections = null;

	this._initialize_resource_collections = function(){
		this.resource_collections = {};
		var resource_types = Sealious.ChipManager.get_chips_by_type("resource_type");
		for (var resource_type_name in resource_types){
			resource_type = resource_types[resource_type_name];
			this.resource_collections[resource_type_name] = new ResourceCollection(resource_type);
		}
	}

	this.getChildSubject = function(key){
		if (this.resource_collections===null){
			this._initialize_resource_collections();
		}
		return this.resource_collections[key];
	}
}

RootSubject.prototype = Object.create(Sealious.Subject.prototype)

module.exports = new RootSubject();