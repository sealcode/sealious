"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const UUIDGenerator = require("shortid");
const merge = require("merge");
const clone = require("clone");
const expandHash = require("expand-hash");
const Sealious = locreq("lib/main.js");

const SingleResource = require("./single-resource-subject.js");
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

function CollectionSubject(app, collection){
	this.collection = collection;
	this.name = "Collection";


	// these methods are here so they can havve access to 'app' variable

	this.create_resource = function(context, body){
		const self = this;
		return CollectionSubject.prototype.__create_resource(app.ChipManager.get_datastore_chip(), self.collection, context, body);
	};

	this.list_resources = function(context, params){
		const datastore = app.ChipManager.get_datastore_chip();
		const self = this;
		return CollectionSubject.prototype.__list_resources(datastore, self.collection, context, params);
	};

	this.get_child_subject = function(key){
		const resource_id = key;
		const single_resource_subject = new SingleResource(app, this.collection, resource_id);
		return Promise.resolve(single_resource_subject);
	};

}

CollectionSubject.prototype = Object.create(Subject.prototype);

CollectionSubject.prototype.__create_resource = function(datastore, collection, context, body){
	return collection.check_if_action_is_allowed(context, "create")
	.then(function(){
		return collection.validate_field_values(context, true, body);
	}).then(function(){
		return collection.encode_field_values(context, body);
	}).then(function(encoded_body){
		const newID = UUIDGenerator(10);
		const resource_data = {
			sealious_id: newID,
			collection: collection.name,
			body: encoded_body,
			created_context: context,
			last_modified_context: context,
		};
		return datastore.insert(collection.name, resource_data, {});
	}).then(function(database_entry){
		return collection.get_resource_representation(context, database_entry);
	})
	.then(function(representation){
		return new Sealious.Responses.ResourceCreated(representation);
	});
};

CollectionSubject.prototype.__preprocess_resource_filter = function(collection, context, filter){
	filter = clone(filter) || {};
	const expanded_filter = expandHash(filter);
	const processed_filter = {};
	for (const field_name in expanded_filter){
		if (collection.fields[field_name]){
			const field = collection.fields[field_name];
			const field_filter = expanded_filter[field_name];
			processed_filter[field_name] = field.filter_to_query(context, field_filter);
		}
	}
	return Promise.props(processed_filter);
};

const get_output_options = function(collection, params){

	const output_options = {};

	if (params.pagination){
		const default_pagination_params = {
			page: 1,
			items: 10
		};
		const full_pagination_params = merge(default_pagination_params, params.pagination);

		const must_be_int = ["items", "page"];
		must_be_int.forEach(function(attribute_name){
			if (isNaN(parseInt(full_pagination_params[attribute_name]))){
				full_pagination_params[attribute_name] = default_pagination_params[attribute_name];
			} else {
				full_pagination_params[attribute_name] = parseInt(full_pagination_params[attribute_name]);
			}
		});

		output_options.skip = (full_pagination_params.page - 1) * full_pagination_params.items;
		output_options.amount = full_pagination_params.items;
	} else {
		if (params.skip){
			output_options.skip = parseInt(params.skip);
		}
		if (params.amount){
			output_options.amount = parseInt(params.count);
		}
	}

	if (params.sort){
		const full_sort_params = clone(params.sort);
		for (const field_name in full_sort_params){
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
};

CollectionSubject.prototype.__list_resources = function(datastore, collection, context, params){
	if (params === undefined || params === null){
		params = {};
	}

	const access_strategy = collection.get_access_strategy("retrieve");
	let decoded_items;

	const output_options = get_output_options(this.collection, params);

	return collection.check_if_action_is_allowed(context, "retrieve")
	.then(function(){
		return CollectionSubject.prototype.__preprocess_resource_filter(collection, context, params.filter);
	}).then(function(body_filter){
		const query = {};
		for(const field_name in body_filter){
			query[`body.${  field_name}`] = body_filter[field_name];
		}

		if (params.search){
			query.$text = {
				$search: params.search.toString(),
				$caseSensitive: false,
				$diacriticSensitive: false,
			};
		}
		return datastore.find(collection.name, query, {}, output_options);
	})
	.map(function(db_document){
		return collection.get_resource_representation(context, db_document, params.format)
		.catch({type: "permission"}, function(error){
			return undefined;
		});
	}).filter((e)=> e !== undefined)
	.then(function(result){
		decoded_items = result;
		return access_strategy.is_item_sensitive();
	})
	.then(function(is_item_sensitive){
		if (is_item_sensitive){
			return Promise.filter(decoded_items, function(item){
				return access_strategy.check(context, item)
				.then(function(){
					return true;
				}).catch({type: "permission"}, function(err){
					return false;
				});
			});
		} else {
			return decoded_items;
		}
	});
};

CollectionSubject.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
	case "create":
		return this.create_resource(context, args);
	case "show":
		return this.list_resources(context, args);
	default:
		throw new Errors.DeveloperError(`Unknown action for '${  this.collection.name  }' collection: '${  action_name  }'`);
	}
};

CollectionSubject.subject_name = "collection";

module.exports = CollectionSubject;
