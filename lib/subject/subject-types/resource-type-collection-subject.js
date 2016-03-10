var Sealious = require("sealious");
var Promise = require("bluebird");
var UUIDGenerator = require("uid");
var merge = require("merge");

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
			created_context: context,
			last_modified_context: context
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

	var access_strategy = self.resource_type.get_access_strategy("retrieve");
	var decoded_items;

	var output_options = {};

	if (params.pagination){
		var default_pagination_params = {
			page: 1,
			items: 10,
		}
		var full_pagination_params = merge(default_pagination_params, params.pagination);

		var must_be_int = ["items", "page"];
		must_be_int.forEach(function(attribute_name){
			if (isNaN(parseInt(full_pagination_params[attribute_name]))){
				full_pagination_params[attribute_name] = default_pagination_params[attribute_name];
			} else {
				full_pagination_params[attribute_name] = parseInt(full_pagination_params[attribute_name]);
			}
		})

		output_options.skip = (full_pagination_params.page - 1) * full_pagination_params.items;
		output_options.amount = full_pagination_params.items;
	}


	return self.resource_type.check_if_action_is_allowed(context, "retrieve")
	.then(function(){
		return self._preprocess_resource_filter(context, params.filter)
	}).then(function(body_filter){
		var query = {
			type: self.resource_type.name,
			body: body_filter
		};

		if (params.search){
			query.$text = {
				$search: params.search.toString(),
				$caseSensitive: false,
				$diacriticSensitive: false
			}
		}

		return Sealious.Datastore.find("resources", query, {}, output_options)
		.then(function(data){
			return data;
		})
	})
	.map(self.resource_type.get_resource_representation.bind(self.resource_type, context))
	.then(function(result){
		decoded_items = result;
		return access_strategy.is_item_sensitive()
	})
	.then(function(is_item_sensitive){
		if (is_item_sensitive){
			return Promise.filter(decoded_items, function(item){
				return access_strategy.check(context, item)
				.then(function(){
					return true;
				}).catch({type: "permission"}, function(err){
					return false;
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
			throw new Sealious.Errors.DeveloperError("Unknown action for '" + this.resource_type.name + "' collection: '" + action_name + "'");
	}
}

ResourceTypeCollection.prototype.get_child_subject = function(key){
	var resource_id = key;
	var single_resource_subject = new SingleResource(this.resource_type, resource_id);
	return Promise.resolve(single_resource_subject);
}

module.exports = ResourceTypeCollection;
