"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const merge = require("merge");

const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

const CollectionFieldSubject = function(resource_type, resource_id, field_name){
	this.name = "CollectionFieldSubject";

	this.resource_type = resource_type;
	this.resource_id = resource_id;
	this.field_name = field_name;
	this.field_type = resource_type[field_name].type;
};

CollectionFieldSubject.prototype = Object.create(Subject.prototype);

CollectionFieldSubject.prototype.perform_action = function(context, action_name, params){
	params = params || {};
	merge(params, {
		resource_id: this.resource_id,
		field_name: this.field_name,
		resource_type: this.resource_type,
	});
	if (this.field_type.actions[action_name]){
		return Promise.resolve(this.field_type.actions[action_name](context, params));
	} else {
		throw new Errors.DeveloperError(`Unknown action: '${action_name}'`);
	}
};

CollectionFieldSubject.prototype.get_child_subject = function(key){
	const self = this;
	return Promise.try(function(){
		return self.field_type.get_child_subject(key);
	});
};

module.exports = CollectionFieldSubject;
