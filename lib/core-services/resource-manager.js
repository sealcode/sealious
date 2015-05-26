var Promise = require("bluebird");
var ResourceRepresentation = require("../chip-types/resource-representation.js");

var UUIDGenerator = require("uid");

/**
 * Manages resources in the database
 * @class
 */
 var ResourceManager = new function(){
 	this.name = "resources";

 	this.create = function(context, type_name, body){
 		if(!Sealious.ChipManager.chip_exists("resource_type", type_name)){
 			return Promise.reject(Sealious.Errors.ValidationError("Unknown resource type: " + type_name));
 		}
 		var resource_type_object = Sealious.ChipManager.get_chip("resource_type", type_name);
 		var access_strategy = resource_type_object.get_access_strategy("create");

 		var encoded_body = null;

		return access_strategy.check(context)
		.then(function(){
			return resource_type_object.validate_field_values(context, body);
		}).then(function(){
			return resource_type_object.encode_field_values(context, body);
		}).then(function(response){
			encoded_body = response;
			var newID = UUIDGenerator(10);
			var resource_data = {
				sealious_id: newID,
				type: type_name,
				body: encoded_body
			};
			return Sealious.Dispatcher.datastore.insert("resources", resource_data, {});
		}).then(function(data){
			var database_entry = data[0];
			return resource_type_object.decode_db_entry(context, database_entry);
		})
 	}

 	this.delete = function(context, type_name, id){
 		if(!Sealious.ChipManager.chip_is_registred("resource_type." + type_name)){
 			throw new Sealious.Errors.ValidationError("Unknown resource type: " + type_name);
 		}

 		var resource_type_object = Sealious.ChipManager.get_chip("resource_type", type_name);
 		var access_strategy = resource_type_object.get_access_strategy("delete");
 		return access_strategy.check(context)
		.then(function(){
			return Sealious.Dispatcher.datastore.delete("resources", {sealious_id: id, type: type_name}, {})
		})
		.then(function(data){
			return Promise.resolve();
		});
 	}

 	this.get_by_id = function(context, resource_id){
 		var get_resource = Sealious.Dispatcher.datastore.find("resources", { sealious_id: resource_id }, {})
 		.then(function(documents){
 			if (documents[0] === undefined) {
 				return Promise.reject(new Sealious.Errors.NotFound("resource of id " + resource_id + " not found"));
 			} else {
 				var database_entry = documents[0];
 				var resource_type_name = database_entry.type;
 				var resource_type_object = Sealious.ChipManager.get_chip("resource_type", resource_type_name);
 				var ret = [];
 				ret[0] = resource_type_object;
 				ret[1] = resource_type_object.decode_db_entry(context, database_entry);
 				return Promise.all(ret);
 			}			
 		}).then(function(response){
 			var resource_type = response[0];
 			var resource_data = response[1];
 			var access_strategy = resource_type.get_access_strategy("retrieve");
 			return access_strategy.check(context, resource_data);
 		})
 		return get_resource;
 	}

 	function filter_resource_list(context, access_strategy){
 		return function(item){
 			return new Promise(function(resolve, reject){
 				access_strategy.check(context, item)
 				.then(function(){
 					resolve(true);
 				}).catch(function(){
 					resolve(false);
 				})
 			});	
 		}
 	}

 	this.list_by_type = function(context, type_name){
 		var resource_type = Sealious.ChipManager.get_chip("resource_type", type_name);
 		var access_strategy = resource_type.get_access_strategy("retrieve");
 		var preliminary_access_strategy_check;
 		if(access_strategy.item_sensitive){
 			preliminary_access_strategy_check = Promise.resolve();
 		}else{
 			preliminary_access_strategy_check = access_strategy.check(context);
 		}

 		var get_items = preliminary_access_strategy_check.then(function(){
 			return Sealious.Dispatcher.datastore.find("resources", { type: type_name }, {}, {});
 		});

 		var decoded_items = get_items.map(resource_type.decode_db_entry.bind(resource_type, context));

 		var filtered_items;
 		if(access_strategy.item_sensitive){
 			filtered_items = decoded_items.then(function(items){
 				return Promise.filter(items, filter_resource_list(context, access_strategy));
 			});
 		}else{
 			filtered_items = decoded_items;
 		}
 		return filtered_items;
 	}

 	this.find = function(context, field_values, type){
 		throw new Error("ResourceManager.find not implemented.");
 		/*
 		if(arguments.length==2){
 			type = null;
 		}
		var query = {};
		if(type){
			query.type = type;
		}
		for(var field_name in field_values){
			query["body." + field_name] = field_values[field_name];
		}
		return Sealious.Dispatcher.datastore.find("resources", query)
		.then(function(documents){
			var parsed_documents = documents.map(function(document){return new ResourceRepresentation(document).getData()});
			return Promise.resolve(parsed_documents);
		});
		*/
 	}

 	this.update_resource = function(context, resource_id, new_resource_data){
 		var query = {};

 		if(new_resource_data.hasOwnProperty("sealious_id")){
 			delete new_resource_data.sealious_id;
 		}
 		if(new_resource_data.hasOwnProperty("id")){
 			delete new_resource_data.id;
 		}

 		for(var field_name in new_resource_data){
 			query["body." + field_name] = new_resource_data[field_name];
 		}

		return Sealious.Dispatcher.datastore.update("resources", {sealious_id: resource_id}, {$set: query})
		.then(function(){
			return Sealious.Dispatcher.resources.get_by_id(context, resource_id);
		})
 	}

 	this.search = function(context, type, field_name, query_string){
 		query = {body: {}};
 		query["body"][field_name] = new RegExp(query_string, "gi");
 		return new Promise(function(resolve, reject){
 			Sealious.Dispatcher.datastore.find("resources", query)
 			.then(function(documents){
 				var resource_representations = documents.map(function(document){return new ResourceRepresentation(document).getData()});
 				resolve(resource_representations);
 			})
 		})
 	}

 	this.search_by_mode = function(context, type, mode){
 		return new Promise(function(resolve, reject){	
 			Sealious.Dispatcher.datastore.find("resources", {access_mode: mode, type: type}, {})
 			.then(function(documents){
 				var database_entry = documents;
 				var resource_representations = documents.map(function(document){
 					return new ResourceRepresentation(document).getData()
 				});
 				resolve(resource_representations);
 			});
 		});
 	}

 	this.get_resource_type_signature = function(context, type_name){
 		return new Promise(function(resolve, reject){
 			var resource_type_chip = Sealious.ChipManager.get_chip("resource_type", type_name);
 			if(resource_type_chip){
 				resolve(resource_type_chip.get_signature());
 			}else{
 				reject(new Sealious.Errors.Error("ResourceManager tried to access resource type `" + type_name + "`, which does not exist."));
 			}
 		})
 	}
 }


 module.exports = ResourceManager;
