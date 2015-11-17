var Sealious = require("sealious");
var Promise = require("bluebird");
var UUIDGenerator = require("uid");

var SingleResource = require("./single-resource-subject.js");

var ResourceCollection = function(resource_type){
	this.resource_type = resource_type;
}

ResourceCollection.prototype = Object.create(Sealious.Subject);

ResourceCollection.prototype.create_resource = function(context, body){
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
		return self.resource_type.decode_db_entry(context, database_entry);
	})
}

ResourceCollection.prototype.list_resources = function(context){
	var self = this;

	//"retrieve" should probably be changed to "list" here. To consider when refactoring 
	//deep access strategies
	var access_strategy = self.resource_type.get_access_strategy("retrieve");

	return self.resource_type.check_if_action_is_allowed(context, "retrieve")
	.then(function(){
		return Sealious.Datastore.find("resources", {type: self.resource_type.name}, {}, {});
	})
	.map(function(db_entry){
		return self.resource_type.decode_db_entry(context, db_entry);
	})
	.then(function(decoded_items){
		if(access_strategy.item_sensitive){
			return Promise.filter(decoded_items, function(item){
				return access_strategy.check(context, item);
			});
		}else{
			return decoded_items;
		}
	})
}

ResourceCollection.prototype.perform_action = function(context, action_name, args){
	switch(action_name){
		case "create":
			return this.create_resource(context, args.body);
		case "show":
			return this.list_resources(context)
		default: 
			throw new Sealious.Errors.DeveloperError("Unknown action for '" + this.resource_type.name +"' collection: '" + action_name +"'");
			break;
	}
}

ResourceCollection.prototype.getChildSubject = function(key){
	var resource_id = key;
	return new SingleResource(this.resource_type, resource_id);
}

module.exports = ResourceCollection;