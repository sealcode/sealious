var Sealious = require("sealious");
var Promise = require("bluebird");
var UUIDGenerator = require("uid");

var SingleResource = require("./single-resource-subject.js");

var ResourceTypeCollection = function(resource_type){
	this.resource_type = resource_type;
	this.name = "ResourceTypeCollection";
}

ResourceTypeCollection.prototype = Object.create(Sealious.Subject.prototype);

ResourceTypeCollection.prototype.create_resource = function(context, body){

	var self = this;

	return self.resource_type.check_if_action_is_allowed(context, "create")
	.then(function(){
		return self.resource_type.validate_field_values(context, true, body);
	}).then(function(){
		return self.resource_type.encode_field_values(context, body);
	}).then(function(encoded_body){
		var newID = UUIDGenerator(10);
		var resource_data = {
			sealious_id: newID,
			type: self.resource_type.name,
			body: encoded_body,
			created_context: context.toObject(),
			last_modified_context: context.toObject()
		};
		return Sealious.Datastore.insert("resources", resource_data, {});
	}).then(function(database_entry){
		return self.resource_type.get_resource_representation(context, database_entry);
	})
}

ResourceTypeCollection.prototype._preprocess_resource_filter  = function(context, filter){
	var self = this;
	var processed_filter = {};
	for (var field_name in filter){
		if (self.resource_type.fields[field_name]){
			var encoded_value = self.resource_type.fields[field_name].encode_value(context, filter[field_name]);
			processed_filter[field_name] = Promise.props({$eq: encoded_value});
		}
	}
	return Promise.props(processed_filter);
}

ResourceTypeCollection.prototype.list_resources = function(context, params){
	var self = this;
	if (params === undefined || params === null){
		params = {};
	}

	//"retrieve" should probably be changed to "list" here. To consider when refactoring
	//deep access strategies
	var access_strategy = self.resource_type.get_access_strategy("retrieve");

	return self.resource_type.check_if_action_is_allowed(context, "retrieve")
	.then(function(){
		return self._preprocess_resource_filter(context, params.filter)
	}).then(function(body_filter){
		return Sealious.Datastore.find(
			"resources",
			{
				type: self.resource_type.name,
				body: body_filter
			}, {}, {}
		);
	})
	.map(self.resource_type.get_resource_representation.bind(self.resource_type, context))
	.then(function(decoded_items){
		if (access_strategy.item_sensitive){
			return Promise.filter(decoded_items, function(item){
				return access_strategy.check(context, item)
				.then(function(){
					return true;
				}).catch(function(err){
					if (err.type==="permission"){
						return false;
					} else {
						throw err;
					}
				})
			});
		} else {
			return decoded_items;
		}
	})
}

ResourceTypeCollection.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
		case "create":
			return this.create_resource(context, args);
		case "show":
			return this.list_resources(context, args)
		default:
			throw new Sealious.Errors.DeveloperError("Unknown action for '" + this.resource_type.name +"' collection: '" + action_name +"'");
	}
}

ResourceTypeCollection.prototype.get_child_subject = function(key){
	var resource_id = key;
	return new SingleResource(this.resource_type, resource_id);
}

module.exports = ResourceTypeCollection;
