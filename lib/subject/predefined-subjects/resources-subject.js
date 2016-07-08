var Promise = require("bluebird");

var Errors = require.main.require("lib/response/error.js");
var ChipManager = require.main.require("lib/chip-types/chip-manager.js");
var Subject = require.main.require("lib/subject/subject.js");

var ResourceTypeCollection = require("../subject-types/resource-type-collection-subject.js");

var ResourcesSubject = function(){

	this.resource_collections = null;

	this._initialize_resource_collections = function(){
		this.resource_collections = {};
		var resource_types = ChipManager.get_chips_by_type("resource_type");
		for (var resource_type_name in resource_types){
			resource_type = resource_types[resource_type_name];
			this.resource_collections[resource_type_name] = new ResourceTypeCollection(resource_type);
		}
	}

	this.get_child_subject = function(key){
		if (this.resource_collections === null || this.resource_collections[key] === undefined){
			this._initialize_resource_collections();
		}
		if (this.resource_collections[key] === undefined){
			throw new Errors.BadSubjectPath(`Unknown resource type: '${key}'.`);
		}
		return Promise.resolve(this.resource_collections[key]);
	}

	this.perform_action = function(context, action_name, arguments){
		throw new Errors.BadSubjecAction("This subject does not provide any actions.");
	}
}

ResourcesSubject.prototype = Object.create(Subject.prototype)

module.exports = new ResourcesSubject();
