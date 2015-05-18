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
			throw new Sealious.Errors.ValidationError("Unknown resource type: " + type_name);
		}
		var resource_type_object = Sealious.ChipManager.get_chip("resource_type", type_name);

		var encoded_body = null;

		return new Promise(function(resolve, reject){
			resource_type_object.validate_field_values(body)
			.then(
				function(){
					return resource_type_object.encode_field_values(context, body);
				}).then(
				function(response){
					encoded_body = response;
					var newID = UUIDGenerator(10);
					var resource_data = {
						sealious_id: newID,
						type: type_name,
						body: encoded_body
					};

					Sealious.Dispatcher.datastore.insert("resources", resource_data, {}).then(function(data){
						var database_entry = data[0];
						var resource = new ResourceRepresentation(database_entry);
						resolve(resource.getData());
					});
				}
				).catch(function(e){
					reject(e);
				});
			})

	}

	this.edit_resource_access_mode = function(context, resource_id, access_mode, access_mode_args){
		if(arguments.length==3){
			access_mode_args={};
		}
		return Sealious.Dispatcher.datastore.update("resources", {sealious_id: resource_id }, { $set: { access_mode:access_mode, access_mode_args: access_mode_args} });
	}

	this.get_resource_access_mode = function(context, resource_id){
		return new Promise(function(resolve,reject){
			Sealious.Dispatcher.datastore.find("resources", { sealious_id: resource_id }, {})
			.then(function(documents){
				var database_entry = documents[0];

				var resource = new ResourceRepresentation(database_entry);
				resolve(resource.get_access_mode());
			}); 		
		});
	}

	this.delete = function(context, type_name, id){
		if(!Sealious.ChipManager.chip_is_registred("resource_type." + type_name)){
			throw new Sealious.Errors.ValidationError("Unknown resource type: " + type_name);
		}

		return new Promise(function(resolve, reject){
			Sealious.Dispatcher.datastore.delete("resources", {sealious_id: id, type: type_name}, {})
			.then(function(data){
				resolve();
			}).catch(function(e){
				reject(e);
			});
		})

	}

	/**
	 * Callback for idExists
	 * @callback ResourceManager~idExistsCallback
	 * @param {Boolean} exists - true if a resource with given id exists
	 */

	 this.get_by_id = function(context, resource_id){
		var get_resource = Sealious.Dispatcher.datastore.find("resources", { sealious_id: resource_id }, {})
		.then(function(documents){
			if (documents[0] === undefined) {
				return Promise.reject(new Sealious.Errors.NotFound("resource of id " + resource_id + " not found"));
			} else {
				var database_entry = documents[0];
				var resource = new ResourceRepresentation(database_entry);
				return Promise.resolve([database_entry.type, resource.getData()]);
			}			
		}).then(function(response){
			var resource_type_name = response[0];
			var resource_data = response[1];
			var resource_type = Sealious.ChipManager.get_chip("resource_type", resource_type_name);
			var access_strategy = resource_type.access_strategy;
			return access_strategy.check(context, resource_data);
		});
		return get_resource;
	 }
	 
	 this.list_by_type = function(context, type_name){
		var resource_type = Sealious.ChipManager.get_chip("resource_type", type_name);
		var access_strategy = resource_type.access_strategy;
		var preliminary_access_strategy_check;
		if(access_strategy.item_sensitive){
			preliminary_access_strategy_check = Promise.resolve();
		}else{
			preliminary_access_strategy_check = access_strategy.check(context);
		}

		var get_items = preliminary_access_strategy_check.then(function(){
			return Sealious.Dispatcher.datastore.find("resources", { type: type_name }, {}, {});
		}).then(function(items) {
			return Promise.map(items, function(database_entry){
				return new ResourceRepresentation(database_entry).getData();
			});
		});
		if(access_strategy.item_sensitive){
			return get_items.then(function(items){
				return Promise.filter(items, function(item){
					return new Promise(function(resolve, reject){
						access_strategy.check(context, item)
						.then(function(){
							resolve(true);
						}).catch(function(){
							resolve(false);
						})
					});
				})
			});
		}else{
			return get_items;
		}
	 }

	 this.find = function(context, field_values, type){
		if(arguments.length==2){
			type = null;
		}
		return new Promise(function(resolve, reject){
			var query = {};
			if(type){
				query.type = type;
			}
			for(var field_name in field_values){
				query["body." + field_name] = field_values[field_name];
			}
			Sealious.Dispatcher.datastore.find("resources", query)
			.then(function(documents){
				var parsed_documents = documents.map(function(document){return new ResourceRepresentation(document).getData()});
				resolve(parsed_documents);
			})
		})
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

		return new Promise(function(resolve, reject){
			Sealious.Dispatcher.datastore.update("resources", {sealious_id: resource_id}, {$set: query})
			.then(function(){
				return Sealious.Dispatcher.resources.get_by_id(resource_id);
			})
			.then(resolve);
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
				reject(new Sealious.Errors.Error("ResourceManager tried to access chip type `" + type_name + "`, which does not exist."));
			}
		})
	 }
	}


	module.exports = ResourceManager;
