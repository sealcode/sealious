"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const Errors = locreq("lib/response/error.js");
const ChipManager = locreq("lib/chip-types/chip-manager.js");
const Subject = locreq("lib/subject/subject.js");

const CollectionSubject = locreq("lib/subject/subject-types/collection-subject.js");

const CollectionsSubject = function(){

	this.resource_collections = null;

	this._initialize_resource_collections = function(){
		this.resource_collections = {};
		const collections = ChipManager.get_chips_by_type("collection");
		for (const collection_name in collections){
			const collection = collections[collection_name];
			this.resource_collections[collection_name] = new CollectionSubject(collection);
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

	this.perform_action = function(context, action_name, args){
		throw new Errors.BadSubjecAction("This subject does not provide any actions.");
	};
};

CollectionsSubject.prototype = Object.create(Subject.prototype);

module.exports = new CollectionsSubject();
