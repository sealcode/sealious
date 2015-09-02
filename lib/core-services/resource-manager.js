var Sealious = require("../main.js");
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
			return resource_type_object.validate_field_values(context, true, body);
		}).then(function(){
			return resource_type_object.encode_field_values(context, body);
		}).then(function(response){
			encoded_body = response;
			var newID = UUIDGenerator(10);
			var resource_data = {
				sealious_id: newID,
				type: type_name,
				body: encoded_body,
				created_context: context.toObject(),
			};
			return Sealious.Dispatcher.datastore.insert("resources", resource_data, {});
		}).then(function(inserted_document){
			var database_entry = inserted_document;
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
			return Sealious.Dispatcher.datastore.remove("resources", {sealious_id: id, type: type_name}, {})
		})
		.then(function(data){
			return Promise.resolve();
		});
 	}

 	this.get_by_id = function(context, resource_id){
 		//var access_strategy = resource_type_object.get_access_strategy("get_by_id");

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
 		//throw new Error("ResourceManager.find not implemented.");
 		
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
		
 	}

 	this.patch_resource = function(context, type_name, resource_id, values_to_patch){
 		//replaces just the provided values. Equivalent of PATCH request
 		var resource_type_object = Sealious.ChipManager.get_chip("resource_type", type_name);
 		access_strategy =  resource_type_object.get_access_strategy();
 		var get_item;
 		if(access_strategy.item_sensitive || resource_type_object.is_old_value_sensitive()){
 			get_item = Sealious.Dispatcher.resources.get_by_id(context, resource_id);
 		}else{
 			get_item = Promise.resolve(null);
 		}

 		return get_item.then(function(item){
 			return access_strategy.check(context, item);
 		}).then(function(old_values){
 			return resource_type_object.validate_field_values(context, false, values_to_patch, old_values)
 			.then(function(){
 				return Promise.resolve(old_values);
 			})
 		}).then(function(old_values){
 			return resource_type_object.encode_field_values(context, values_to_patch, old_values && old_values.body);
 		}).then(function(encoded_values){
 			var query = {};
 			query.last_modified_context = context.toObject();
 			for(var field_name in encoded_values){
				query["body." + field_name] = encoded_values[field_name];
			}
			if(Object.keys(query).length==0){
				return Promise.resolve();
			}else{
 				return Sealious.Dispatcher.datastore.update("resources", {sealious_id: resource_id}, {$set: query})				
			}
 		}).then(function(){
 			return Sealious.Dispatcher.resources.get_by_id(context, resource_id);
 		});
 	}

 	this.update_resource = function(context, type_name, resource_id, new_resource_data){
 		//replaces all values. Equivalent of POST request
 		var resource_type_object = Sealious.ChipManager.get_chip("resource_type", type_name);
 		var get_old_value;

 		if (resource_type_object.is_old_value_sensitive()){
 			get_old_value = Sealious.Dispatcher.resources.get_by_id(context, resource_id);
 		}else {
 			get_old_value = Promise.resolve(null);
 		}

 		return get_old_value.then(function(old_value){
 			return resource_type_object.validate_field_values(context,true, new_resource_data, old_value);
 		}).then(function(){
			if(new_resource_data.hasOwnProperty("sealious_id")){
				delete new_resource_data.sealious_id;
			}
			if(new_resource_data.hasOwnProperty("id")){
				delete new_resource_data.id;
			}
			
			/*
			for(var field_name in new_resource_data){
				query["body." + field_name] = new_resource_data[field_name];
			}
			*/
			return Sealious.Dispatcher.datastore.update("resources", {sealious_id: resource_id}, {$set: {body: new_resource_data, last_modified_context: context.toObject()}})
 		}).then(function(){
			return Sealious.Dispatcher.resources.get_by_id(context, resource_id);
		});
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

 	this.test_init = function(){
 		// Creating resource always fails
 		var always_fails = new Sealious.ChipTypes.FieldType("always_fails");	
 		always_fails.prototype.isProperValue = function(value_in_code){
 			return new Promise(function(resolve, reject){
 				reject();
 			})
 		}
 		var always_fails_resource = new Sealious.ChipTypes.ResourceType({
 			name: "always_fails_resource",
 			fields: [
 				{name: "#fail", type: "always_fails"}
 			]
 		});


 		//Creating resource never fails
 		var never_fails = new Sealious.ChipTypes.FieldType("never_fails");
 		never_fails.prototype.isProperValue = function(value_in_code){
 			return new Promise(function(resolve,reject){
 				resolve();
 			})
 		}

 		var never_fails_resource = new Sealious.ChipTypes.ResourceType({
 			name: "never_fails_resource",
 			fields: [
 				{name: "#success", type: "never_fails"},
 			]
 		});
 	}

 	this.test_start = function(){
 		describe("ResourceManager", function(){
			var context = Sealious.Context();

		    it('should not create a new resource', function(done){
				Sealious.Dispatcher.resources.create(context, "always_fails_resource", { "#fail": "tak" })
				.then(function(){
					done(new Error("It didn't throw an error!"));
				}).catch(function(error){
					done();
				});
		 	});
		 	it('should create a new resource', function(done){
				Sealious.Dispatcher.resources.create(context, "never_fails_resource", { "#success": "tak" })
				.then(function(result){
					done();
				}).catch(function(error){
					done(error);
				});
		 	});
		 	it('should get data about the resource', function(done){
				Sealious.Dispatcher.resources.create(context, "never_fails_resource", { "#success": "tak" })
				.then(function(result){
					return Sealious.Dispatcher.resources.get_by_id(context, result.id)
					.then(function(resource){
						done();	
					})
				}).catch(function(error){
					done(error);
				});
		 	});
		 	it('should delete the resource', function(done){
				Sealious.Dispatcher.resources.create(context, "never_fails_resource", { "#success": "tak" })
				.then(function(result){
					Sealious.Dispatcher.resources.delete(context, "never_fails_resource", result.id)
					.then(function(resource){
						done();	
					}).catch(function(error){
						done(new Error(error));
					})
				}).catch(function(error){
					done(new Error("It threw an error!"));
				});
		 	});
		 	it('should update the resource', function(done){
				Sealious.Dispatcher.resources.create(context, "never_fails_resource", { "#success": "tak" })
				.then(function(result){
					Sealious.Dispatcher.resources.update_resource(context, "never_fails_resource", result.id, {"#success" : "tak2"})
					.then(function(resource){
						done();	
					}).catch(function(error){
						done(new Error(error));
					})
				}).catch(function(error){
					done(error);
				});
		 	});
		 	it('should list resources by type', function(done){
				Sealious.Dispatcher.resources.list_by_type(context, "never_fails_resource")
				.then(function(result){
					done();
				}).catch(function(error){
					done(new Error("It threw an error!"));
				});
		 	});
		 	it('should get resource type signature (schema)', function(done){
				Sealious.Dispatcher.resources.get_resource_type_signature(context, "never_fails_resource")
				.then(function(result){
					done();
				}).catch(function(error){
					done(new Error("It threw an error!"));
				});
		 	});


		 	//run(); //!!important	
 		})

 	}
 }


 module.exports = ResourceManager;
