const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const Errors = locreq("lib/response/error.js");
const ChipManager = locreq("lib/chip-types/chip-manager.js");
const Subject = locreq("lib/subject/subject.js");

const ResourceTypeCollection = require("../subject-types/resource-type-collection-subject.js");

const ResourcesSubject = function(){

	this.resource_collections = null;

	this._initialize_resource_collections = function(){
		this.resource_collections = {};
		const resource_types = ChipManager.get_chips_by_type("resource_type");
		for (const resource_type_name in resource_types){
			const resource_type = resource_types[resource_type_name];
			this.resource_collections[resource_type_name] = new ResourceTypeCollection(resource_type);
		}
	};

	this.get_child_subject = function(key){
		if (this.resource_collections === null || this.resource_collections[key] === undefined){
			this._initialize_resource_collections();
		}
		if (this.resource_collections[key] === undefined){
			throw new Errors.BadSubjectPath(`Unknown resource type: '${key}'.`);
		}
		return Promise.resolve(this.resource_collections[key]);
	};

	this.perform_action = function(context, action_name, arguments){
		throw new Errors.BadSubjecAction("This subject does not provide any actions.");
	};
};

ResourcesSubject.prototype = Object.create(Subject.prototype);

module.exports = new ResourcesSubject();
