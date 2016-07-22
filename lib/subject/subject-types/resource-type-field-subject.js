var Promise = require("bluebird");
var merge = require("merge");

var Subject = require.main.require("lib/subject/subject.js");
var Errors = require.main.require("lib/response/error.js");

var ResourceFieldTypeSubject = function(resource_type, resource_id, field_name){
	this.name = "ResourceFieldTypeSubject";

	this.resource_type = resource_type;
	this.resource_id = resource_id;
	this.field_name = field_name;
	this.field_type = resource_type[field_name].type;
}

ResourceFieldTypeSubject.prototype = Object.create(Subject.prototype);

ResourceFieldTypeSubject.prototype.perform_action = function(context, action_name, params){
	params = params || {};
	merge(params, {
		resource_id: this.resource_id,
		field_name: this.field_name,
		resource_type: this.resource_type
	})
	if (this.field_type.actions[action_name]){
		return Promise.resolve(this.field_type.actions[action_name](context, params));
	} else {
		throw new Errors.DeveloperError(`Unknown action: '${action_name}'`);
	}
}

ResourceFieldTypeSubject.prototype.get_child_subject = function(key){
	var self = this;
	return Promise.try(function(){
		return self.field_type.get_child_subject(key);
	})
}

module.exports = ResourceFieldTypeSubject;
