var Sealious = require("sealious");

var ResourceTypeCollection = require("../subject-types/resource-type-collection-subject.js");

var ResourcesSubject = function(){

	this.resource_collections = null;

	this._initialize_resource_collections = function(){
		this.resource_collections = {};
		var resource_types = Sealious.ChipManager.get_chips_by_type("resource_type");
		for (var resource_type_name in resource_types){
			resource_type = resource_types[resource_type_name];
			this.resource_collections[resource_type_name] = new ResourceTypeCollection(resource_type);
		}
	}

	this.get_child_subject = function(key){
		if (this.resource_collections === null){
			this._initialize_resource_collections();
		}
		return this.resource_collections[key];
	}

	this.perform_action = function(context, action_name, arguments){
		throw new Sealious.Errors.BadSubjecAction("This subject does not provide any actions.");
	}
}

ResourcesSubject.prototype = Object.create(Sealious.Subject.prototype)

module.exports = new ResourcesSubject();