var Promise = require("bluebird");
var UUIDGenerator = require("uid");
var merge = require("merge");
var clone = require("clone");
var expandHash = require("expand-hash");

var SingleResource = require("./single-resource-subject.js");
var ChipManager = require.main.require("lib/chip-types/chip-manager.js");
var Subject = require.main.require("lib/subject/subject.js");

var ResourceTypeCollection = function(resource_type){
	this.resource_type = resource_type;
	this.name = "ResourceTypeCollection";
}

ResourceTypeCollection.prototype = Object.create(Subject.prototype);

ResourceTypeCollection.prototype.__create_resource = function(datastore, resource_type, context, body){
	return resource_type.check_if_action_is_allowed(context, "create")
	.then(function(){
		return resource_type.validate_field_values(context, true, body);
	}).then(function(){
		return resource_type.encode_field_values(context, body);
	}).then(function(encoded_body){
		var newID = UUIDGenerator(10);
		var resource_data = {
			sealious_id: newID,
			type: resource_type.name,
			body: encoded_body,
			created_context: context,
			last_modified_context: context
		};
		return datastore.insert("resources", resource_data, {});
	}).then(function(database_entry){
		return resource_type.get_resource_representation(context, database_entry);
	})
}

ResourceTypeCollection.prototype.create_resource = function(context, body){
	return __create_resource(ChipManager.get_datastore_chip(), self.resource_type, context, body);
}

ResourceTypeCollection.prototype.__preprocess_resource_filter = function(resource_type, context, filter){
	filter = clone(filter) || {};
	var expanded_filter = expandHash(filter);
	var processed_filter = {};
	for (var field_name in expanded_filter){
		if (resource_type.fields[field_name]){
			var field = resource_type.fields[field_name];
			var field_filter = expanded_filter[field_name];
			processed_filter[field_name] = field.filter_to_query(context, field_filter);
		}
	}
	return Promise.props(processed_filter);
}

var get_output_options = function(resource_type, params){

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
	} else {
		if (params.skip){
			output_options.skip = parseInt(params.skip);
		}
		if (params.amount){
			output_options.amount = parseInt(params.count)
		}
	}

	if (params.sort){
		var full_sort_params = clone(params.sort);
		for (var field_name in full_sort_params){
			switch (full_sort_params[field_name]){
				case "desc":
					full_sort_params[field_name] = -1;
					break;
				case "asc":
					full_sort_params[field_name] = 1;
					break;
				default:
					delete full_sort_params[field_name];
			}
		}
		output_options.sort = full_sort_params;
	}

	return output_options;
}

ResourceTypeCollection.prototype.list_resources = function(datastore, resource_type, context, params){
	if (params === undefined || params === null){
		params = {};
	}

	var access_strategy = resource_type.get_access_strategy("retrieve");
	var decoded_items;

	var output_options = get_output_options(this.resource_type, params);

	return resource_type.check_if_action_is_allowed(context, "retrieve")
	.then(function(){
		return ResourceTypeCollection.prototype.__preprocess_resource_filter(resource_type, context, params.filter);
	}).then(function(body_filter){
		var query = {
			type: resource_type.name,
			body: body_filter
		};

		if (params.search){
			query.$text = {
				$search: params.search.toString(),
				$caseSensitive: false,
				$diacriticSensitive: false
			}
		}

		return datastore.find("resources", query, {}, output_options);
	})
	.map(function(db_document){
		return resource_type.get_resource_representation(context, db_document, params.format)
		.catch({type: "permission"}, function(error){
			return undefined;
		});
	}).filter((e)=> e !== undefined)
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

ResourceTypeCollection.prototype.list_resources = function(context, params){
	var datastore = ChipManager.get_datastore_chip();
	return ResourceTypeCollection.prototype.__list_resource(datastore, self.resource_type, context, params);
};

ResourceTypeCollection.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
		case "create":
			return this.create_resource(context, args);
		case "show":
			return this.list_resources(context, args)
		default:
			throw new Errors.DeveloperError("Unknown action for '" + this.resource_type.name + "' collection: '" + action_name + "'");
	}
}

ResourceTypeCollection.prototype.get_child_subject = function(key){
	var resource_id = key;
	var single_resource_subject = new SingleResource(this.resource_type, resource_id);
	return Promise.resolve(single_resource_subject);
}

module.exports = ResourceTypeCollection;
