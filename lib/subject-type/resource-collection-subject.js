var Sealious = require("sealious");
var Promise = require("bluebird");
var UUIDGenerator = require("uid");

var ResourceCollection = function(resource_type){
	this.resource_type = resource_type;
}

ResourceCollection.prototype = Object.create(Sealious.Subject);

ResourceCollection.prototype.create_resource = function(context, body){
	var self = this;
	return Promise.try(function(){
		var access_strategy = self.resource_type.get_access_strategy("create");

		var old_values = {};

		if (self.resource_type.is_old_value_sensitive("is_proper_value")) {
			for (var i in self.resource_type.fields) {
				var field = self.resource_type.fields[i];
				old_values[field.name] = null;
			}
		}

		var encoded_body = {};

			var current_item;
			if (access_strategy.item_sensitive){
				current_item = null;
			} else {
				current_item = undefined;
			}

			return access_strategy.check(context, current_item)
		.then(function(){
			return self.resource_type.validate_field_values(context, true, body, old_values);
		}).then(function(){
			return self.resource_type.encode_field_values(context, body);
		}).then(function(response){
			encoded_body = response;
			var newID = UUIDGenerator(10);
			var resource_data = {
				sealious_id: newID,
				type: self.resource_type.name,
				body: encoded_body,
				created_context: context.toObject(),
			};
			return Sealious.Datastore.insert("resources", resource_data, {});
		}).then(function(inserted_document){
			var database_entry = inserted_document;
			return self.resource_type.decode_db_entry(context, database_entry);
		})
	})
}

ResourceCollection.prototype.perform_action = function(context, action_name, args){
	switch(action_name){
		case "create":
			return this.create_resource(context, args.body);
		default: 
			throw new Sealious.Errors.DeveloperError("Unknown action for '" + this.resource_type.name +"' collection: '" + action_name +"'");
			break;
	}
}

module.exports = ResourceCollection;