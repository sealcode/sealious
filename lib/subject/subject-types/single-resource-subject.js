const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const Subject = locreq("lib/subject/subject.js");
const ChipManager = locreq("lib/chip-types/chip-manager.js");
const Errors = locreq("lib/response/error.js");

const ResourceTypeFieldSubject = require("./resource-type-field-subject.js");

const SingleResource = function(resource_type, resource_id){
	this.resource_type = resource_type;
	this.resource_id = resource_id;
	this.name = "SingleResource";
};

SingleResource.prototype = Object.create(Subject.prototype);

SingleResource.prototype.__get_resource = function(datastore, resource_type, resource_id, context, args){
	args = args || {};

	return datastore.find("resources", {sealious_id: resource_id}, {})
	.then(function(db_entries){
		if (db_entries[0] === undefined){
			throw new Errors.NotFound("resource of id " + resource_id + " not found");
		} else {
			return resource_type.get_resource_representation(context, db_entries[0], args.format);
		}
	}).then(function(resource_representation){
		return resource_type.check_if_action_is_allowed(context, "retrieve", resource_representation)
		.then(function(){
			return resource_representation;
		});
	});
};

SingleResource.prototype.get_resource = function(context, args){
	const datastore = ChipManager.get_datastore_chip();
	return SingleResource.prototype.__get_resource(datastore, context, args);
};

SingleResource.prototype.__edit_resource = function(datastore, resource_type, resource_id, context, values_to_patch, delete_empty_values){
	// replaces just the provided values. Equivalent of PATCH request

	delete_empty_values = delete_empty_values === undefined? false : delete_empty_values;

	let resource_representation;
	const self = this;


	return SingleResource.prototype.__get_resource(datastore, resource_type, resource_id, context, {})
	.then(function(resource_data){
		resource_representation = resource_data;
		return resource_type.check_if_action_is_allowed(context, "update", resource_representation);
	}).then(function(){
		return resource_type.validate_field_values(context, delete_empty_values, values_to_patch, resource_representation.body);
	}).then(function(){
		return resource_type.encode_field_values(context, values_to_patch, resource_representation.body);
	}).then(function(encoded_values){
		const query = {};
		query.last_modified_context = context;
		for (const field_name in encoded_values){
			query["body." + field_name] = encoded_values[field_name];
		}
		return datastore.update("resources", {sealious_id: self.resource_id}, {$set: query});
	}).then(function(){
		return SingleResource.prototype.__get_resource(datastore, resource_type, resource_id, context, self.resource_id);
	});
};

SingleResource.prototype.edit_resource = function(context, values_to_patch, delete_empty_values){
	const datastore = ChipManager.get_datastore_chip();
	const self = this;
	return SingleResource.prototype.__edit_resource(datastore, self.resource_type, self.resource_id, context, values_to_patch, delete_empty_values);
};

SingleResource.prototype.__delete_resource = function(datastore, resource_type, resource_id, context, args){

	return SingleResource.prototype.__get_resource(datastore, resource_type, resource_id, context, {})
	.then(function(resource_representation){
		return resource_type.check_if_action_is_allowed(context, "delete", resource_representation);
	}).then(function(){
		return datastore.remove("resources", {
			sealious_id: resource_id,
			type: resource_type.name,
		}, {});
	})
	.then(function(data){
		return Promise.resolve();
	});
};

SingleResource.prototype.delete_resource = function(context, args){
	const datastore = ChipManager.get_datastore_chip();
	const self = this;
	return SingleResource.prototype.__delete_resource(datastore, self.resource_type, self.resource_id, context, args);
};

SingleResource.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
	case "show":
		return this.get_resource(context, args);
	case "edit":
		return this.edit_resource(context, args, false);
	case "replace":
		return this.edit_resource(context, args, true);
	case "delete":
		return this.delete_resource(context, args);
	default:
		throw new Errors.DeveloperError(`Unknown action for '${this.resource_type.name}' resource: '${action_name}'`);
	}
};

SingleResource.prototype.get_child_subject = function(key){
	if (this.resource_type.fields[key].type.is_subject){
		return new ResourceTypeFieldSubject(this.resource_type, this.resource_id, key);
	}
};

module.exports = SingleResource;
