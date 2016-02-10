var Sealious = require("sealious");

var SingleResource = function(resource_type, resource_id){
	this.resource_type = resource_type;
	this.resource_id = resource_id;
	this.name = "SingleResource";
}

SingleResource.prototype = Object.create(Sealious.Subject);

SingleResource.prototype.get_resource = function(context){
	//var access_strategy = resource_type_object.get_access_strategy("get_by_id");

	var self = this;

	return Sealious.Datastore.find("resources", {sealious_id: self.resource_id}, {})
	.then(function(db_entries){
		if (db_entries[0] === undefined) {
			throw new Sealious.Errors.NotFound("resource of id " + self.resource_id + " not found");
		} else {
			return new Sealious.ResourceRepresentation(self.resource_type, db_entries[0]);
		}			
	}).then(function(resource){
		return self.resource_type.check_if_action_is_allowed(context, "retrieve", resource)
		.then(function(){
			return resource;
		})
	})
}

SingleResource.prototype.edit_resource = function(context, values_to_patch, delete_empty_values){
	//replaces just the provided values. Equivalent of PATCH request
	var self = this;

	delete_empty_values = delete_empty_values==undefined? false : delete_empty_values;

	var resource_representation;
	return this.get_resource(context)
	.then(function(resource_data){
		resource_representation = resource_data;
		return this.resource_type.check_if_action_is_allowed(context, "update", resource_representation)
	}).then(function(){
		return self.resource_type.validate_field_values(context, delete_empty_values, values_to_patch, resource_representation.body)
	}).then(function(){
		return self.resource_type.encode_field_values(context, values_to_patch, resource_representation.body);
	}).then(function(encoded_values){
		var query = {};
		query.last_modified_context = context.toObject();
		for (var field_name in encoded_values){
			query["body." + field_name] = encoded_values[field_name];
		}
		return Sealious.Datastore.update("resources", {sealious_id: self.resource_id}, {$set: query});
	}).then(function(){
		return self.get_resource(context, self.resource_id);
	});
}

SingleResource.prototype.delete_resource = function(context, args){
	var self = this;

	return this.get_resource(context)
	.then(function(resource_representation){
		return this.resource_type.check_if_action_is_allowed(context, "delete", resource_representation);
	}).then(function(){
		return Sealious.Datastore.remove("resources", {
			sealious_id: self.resource_id,
			type: self.resource_type.name
		}, {})
	})
	.then(function(data){
		return Promise.resolve();
	});
}

SingleResource.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
		case "show":
			return this.get_resource(context);
		case "edit":
			return this.edit_resource(context, args, false);
		case "replace":
			return this.edit_resource(context, args, true);
		case "delete":
			return this.delete_resource(context, args);
		default: 
			throw new Sealious.Errors.DeveloperError(`Unknown action for '${this.resource_type.name}' resource: '${action_name}'`);
			break;
	}
}

module.exports = SingleResource;
