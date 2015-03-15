var Promise = require("bluebird");

var ResourceRepresentation = require("./resource-representation.js");
var ChipManager = require("./chip-manager.js");

var SealiousErrors = require("../response/error.js");

/**
 * Manages resources in the database
 * @class
 */
 var ResourceManager = new function(){

 	this.create = function(dispatcher, type_name, body, owner, access_mode, access_mode_args){
 		console.log("resource-manager.js:create-resource");
 		if(arguments.length==3){
 			var owner=null;
 			var access_mode = "private";
 			var access_mode_args = [];
 		} else if(arguments.length==4){
 			var access_mode = "private";
 		} else if(arguments.length==5){
 			var access_mode = "private";
 			var access_mode_args = [];
 		} else if(arguments.length==6) {

 		} else {
 			throw new Error("Wrong amount of arguments: create_resource.");
 		}

 		if(!ChipManager.chip_is_registred("resource_type." + type_name)){
 			throw new Error("Unknown resource type: " + type_name);
 		}

 		var resource_type_object = ChipManager.get_chip("resource_type", type_name);

 		var encoded_body = null;

 		return new Promise(function(resolve, reject){
 			resource_type_object.validate_field_values(body)
 			.then(
 				function(){
 					return resource_type_object.encode_field_values(body);
 				}
 				).then(
 				function(response){
 					encoded_body = response;
 					return dispatcher.metadata_increment_variable("first_free_id", dispatcher)
 				}
 				).then(
 				function(newID) {
 					var resource_data = {
 						prometheus_id: newID,
 						type: type_name,
 						body: encoded_body
 					};
 					resource_data.owner = owner;
 					resource_data.access_mode = access_mode;
 					resource_data.access_mode_args = access_mode_args;

 					dispatcher.datastore.insert("resources", resource_data, {}).then(function(data){
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

 	this.edit_resource_access_mode = function(dispatcher, resource_id, access_mode, access_mode_args){
 		if(arguments.length==3){
 			access_mode_args={};
 		}
 		return dispatcher.datastore.update("resources", {prometheus_id: resource_id }, { $set: { access_mode:access_mode, access_mode_args: access_mode_args} });
 	}

 	this.get_resource_access_mode = function(dispatcher, resource_id){
 		resource_id = parseInt(resource_id);
 		return new Promise(function(resolve,reject){
 			dispatcher.datastore.find("resources", { prometheus_id: resource_id }, {})
 			.then(function(documents){
 				var database_entry = documents[0];

 				var resource = new ResourceRepresentation(database_entry);
 				resolve(resource.get_access_mode());
 			}); 		
 		});
 	}

 	this.delete = function(dispatcher, type_name, body){
 		if(!ChipManager.chip_is_registred("resource_type." + type_name)){
 			throw new Error("Unknown resource type: " + type_name);
 		}

 		return new Promise(function(resolve, reject){
 			dispatcher.datastore.delete("resources", {prometheus_id: body.id, type: type_name}, {})
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

	 this.get_by_id = function(dispatcher, resource_id){
	 	resource_id = parseInt(resource_id);
	 	return new Promise(function(resolve,reject){
	 		dispatcher.datastore.find("resources", { prometheus_id: resource_id }, {})
	 		.then(function(documents){
	 			if (documents[0] === undefined) {
	 				reject(new SealiousErrors.NotFound("resource of id " + resource_id + " not found"));
	 			} else {
	 				var database_entry = documents[0];
	 				var resource = new ResourceRepresentation(database_entry);
	 				resolve(resource.getData());
	 			}
	 		});
	 	});
	 }

	 this.list_by_type = function(dispatcher, type_name, params) {
	 	if(arguments.length==2){
	 		params = {};
	 	}
	 	return new Promise(function(resolve, reject){
	 		if(!ChipManager.chip_is_registred("resource_type."+type_name)){
	 			reject(new Error("resource type "+type_name+" does not exist"));
	 		}else{
	 			dispatcher.datastore.find("resources", { type: type_name }, {}, params).then(function(response) {
	 				var ret = response.map(function(database_entry){
	 					return new ResourceRepresentation(database_entry).getData();
	 				})
			 		resolve(ret);
			 	})
	 		}
	 	})
	 }

	 this.find = function(dispatcher, field_values, type){
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
	 		dispatcher.datastore.find("resources", query)
	 		.then(function(documents){
	 			var parsed_documents = documents.map(function(document){return new ResourceRepresentation(document).getData()});
	 			resolve(parsed_documents);
	 		})
	 	})
	 }

	 this.update_resource = function(dispatcher, resource_id, new_resource_data){
	 	var query = {};

	 	if(new_resource_data.hasOwnProperty("prometheus_id")){
	 		delete new_resource_data.prometheus_id;
	 	}
	 	if(new_resource_data.hasOwnProperty("id")){
	 		delete new_resource_data.id;
	 	}

	 	for(var field_name in new_resource_data){
	 		query["body." + field_name] = new_resource_data[field_name];
	 	}

	 	return dispatcher.datastore.update("resources", {prometheus_id: resource_id}, {$set: query});
	 }

	 this.search = function(dispatcher, type, field_name, query_string){
	 	query = {body: {}};
	 	query["body"][field_name] = new RegExp(query_string, "gi");
	 	return new Promise(function(resolve, reject){
	 		dispatcher.datastore.find("resources", query)
	 		.then(function(documents){
	 			var resource_representations = documents.map(function(document){return new ResourceRepresentation(document).getData()});
	 			resolve(resource_representations);
	 		})
	 	})
	 }

	 this.search_by_mode = function(dispatcher, type, mode){
	 	return new Promise(function(resolve, reject){	
		 	dispatcher.datastore.find("resources", {access_mode: mode, type: type}, {})
		 	.then(function(documents){
		 		var database_entry = documents;
		 		var resource_representations = documents.map(function(document){
		 			return new ResourceRepresentation(document).getData()
		 		});
		 		resolve(resource_representations);
		 	});
	 	});
	}

	this.get_resource_type_signature = function(dispatcher, type_name){
		return new Promise(function(resolve, reject){
			var resource_type_chip = ChipManager.get_chip("resource_type", type_name);
			if(resource_type_chip){
				resolve(resource_type_chip.get_signature());
			}else{
				reject(new SealiousErrors.Error("ResourceManager tried to access chip type `" + type_name + "`, which does not exist."));
			}
		})
	}
}


module.exports = ResourceManager;
