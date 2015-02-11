var Promise = require("bluebird");

var ResourceRepresentation = require("./resource-representation.js");
var ChipManager = require("./chip-manager.js");

/**
 * Manages resources in the database
 * @class
 */
 var ResourceManager = new function(){

 	this.create_resource = function(type_name, body, owner, access_mode, access_mode_args, dispatcher){
 		if(arguments.length==3){
 			var dispatcher = arguments[2];
 			var owner=null;
 			var access_mode = "private";
 			var access_mode_args = [];
 		} else if(arguments.length==4){
 			var dispatcher = arguments[3];
 			console.log(owner);
 			var access_mode = "private";
 		} else if(arguments.length==5){
 			var dispatcher = arguments[4];
 			var access_mode = "private";
 			var access_mode_args = [];
 		} else if(arguments.length==6) {

 		} else {
 			throw new Error("Wrong amount of arguments: create_resource.");
 		}

 		if(!ChipManager.chip_is_registred("resource_type." + type_name)){
 			throw new Error("Unknown resource type: " + type_name);
 		}

 		var resource_type_object = ChipManager.get_resource_type(type_name);

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

 					dispatcher.database_query("resources", "insert", resource_data, {}).then(function(data){
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

 	this.edit_resource_access_mode = function(resource_id, access_mode, access_mode_args, dispatcher){
 		if(arguments.length==3){
 			dispatcher = arguments[2];
 			access_mode_args={};
 		}
 		return dispatcher.database_query("resources", "update", {prometheus_id: resource_id }, { $set: { access_mode:access_mode, access_mode_args: access_mode_args} });
 	}

 	this.get_resource_access_mode = function(resource_id, dispatcher){
 		resource_id = parseInt(resource_id);
 		return new Promise(function(resolve,reject){
 			dispatcher.database_query("resources", "find", { prometheus_id: resource_id }, {})
 			.then(function(documents){
 				var database_entry = documents[0];

 				var resource = new ResourceRepresentation(database_entry);
 				resolve(resource.get_access_mode());
 			}); 		
 		});
 	}

 	this.delete_resource = function(type_name, body, dispatcher){
 		if(!ChipManager.chip_is_registred("resource_type." + type_name)){
 			throw new Error("Unknown resource type: " + type_name);
 		}

 		return new Promise(function(resolve, reject){
 			dispatcher.database_query("resources", "delete", {prometheus_id: body.id, type: type_name}, {})
 			.then(function(data){
 				resolve();
 			}).catch(function(e){
 				reject(e);
 			});
 		})

 	}


	/**
	 * Calls callback function with `true` if a resource with given ID exists in the database. Otherwise,
	 * @param  {Number}   prometheus_id 	the id to test for
	 * @param  {string}   [type] 			type of the resource. If provided, callback value will be true only if a resource with a given id AND of a provided type exists
	 * @param  {ResourceManager~idExistsCallback} callback
	 */
	 this.idExists = function(prometheus_id, type_name, callback){
	 	if(arguments.length==2){
	 		callback = arguments[1];
	 		type_name = undefined;
	 	}
	 	var query = {
	 		prometheus_id: parseInt(prometheus_id)
	 	}
	 	if(type_name){
	 		ResourceTypeManager.enforce_correct_type_name(type_name);
	 		query.type = type_name;
	 	}
	 	DatabaseInterface.query("resources", "find", query, {}).then(function(response){
	 		//console.log("resource-manager: idExists -> database callback:", response);
	 		if(response.length===0){
	 			callback(false);
	 		}else{
	 			callback(true);
	 		}
	 	})
	 }

	/**
	 * Callback for idExists
	 * @callback ResourceManager~idExistsCallback
	 * @param {Boolean} exists - true if a resource with given id exists
	 */

	 this.get_resource_by_id = function(resource_id, dispatcher){
	 	console.log("resource-manager.js resource_id:", resource_id);
	 	resource_id = parseInt(resource_id);
	 	return new Promise(function(resolve,reject){
	 		dispatcher.database_query("resources", "find", { prometheus_id: resource_id }, {})
	 		.then(function(documents){
	 			if (documents[0] === undefined) {
	 				reject(new Error("error xD"));
	 			} else {
	 				var database_entry = documents[0];
	 				var resource = new ResourceRepresentation(database_entry);
	 				resolve(resource.getData());
	 			}
	 		});
	 	});
	 }

	 this.list_by_type = function(type_name, params, dispatcher) {
	 	if(arguments.length==2){
	 		dispatcher = arguments[1];
	 		params = {};
	 	}
	 	return new Promise(function(resolve, reject){
	 		if(!ChipManager.chip_is_registred("resource_type."+type_name)){
	 			reject(new Error("resource type "+type_name+" does not exist"));
	 		}else{
	 			dispatcher.database_query("resources", "find", { type: type_name }, {}, params).then(function(response) {
	 				var ret = response.map(function(database_entry){
	 					return new ResourceRepresentation(database_entry).getData();
	 				})
			 		//console.log("resource-manager: list_by_type -> about to call callback");
			 		//console.log(ret);
			 		resolve(ret);
			 	})
	 		}
	 	})
	 }

	 this.find_resource = function(field_values, type, dispatcher){
	 	if(arguments.length==2){
	 		dispatcher = arguments[1];
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
	 		dispatcher.database_query("resources", "find", query)
	 		.then(function(documents){
	 			var parsed_documents = documents.map(function(document){return new ResourceRepresentation(document).getData()});
	 			resolve(parsed_documents);
	 		})
	 	})
	 }

	 this.update_resource = function(resource_id, new_resource_data, dispatcher){
	 	console.log("resource.manager called update_resource with arguments", arguments);
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

	 	console.log("resource-manager.js query", query);
	 	return dispatcher.database_query("resources", "update", {prometheus_id: resource_id}, {$set: query});
	 }

	 this.search_resource = function(type, field_name, query_string, dispatcher){
	 	query = {};
	 	query["body." + field_name] = new RegExp(query_string, "gi");
	 	console.log("resource-manager.search_resource", "query:", query);
	 	return new Promise(function(resolve, reject){
	 		dispatcher.database_query("resources", "find", query)
	 		.then(function(documents){
	 			var resource_representations = documents.map(function(document){return new ResourceRepresentation(document).getData()});
	 			console.log(resource_representations);
	 			resolve(resource_representations);
	 		})
	 	})
	 }

	 this.search_by_mode = function(type, mode, dispatcher){
	 	return new Promise(function(resolve, reject){	
		 	dispatcher.database_query("resources", "find", {access_mode: mode, type: type}, {})
		 	.then(function(documents){
		 		var database_entry = documents;
		 		var resource_representations = documents.map(function(document){
		 			return new ResourceRepresentation(document).getData()
		 		});
		 		resolve(resource_representations);
		 	});
	 	});
	}
}


module.exports = ResourceManager;
