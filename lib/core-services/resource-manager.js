var Sealious = require("../main.js");
var Promise = require("bluebird");
var ResourceRepresentation = require("../chip-types/resource-representation.js");

var assert = require("assert");

var UUIDGenerator = require("uid");

/**
 * Manages resources in the database
 * @class
 */
 var ResourceManager = new function(){
	this.name = "resources";
	var self = this;
	/**
		* Deletes resource of given id
		* @param {Context} context - context 
		* @param {String} type_name - name of deleted resource's type, defined in resource type declaration
		* @param {String} id - id of particular resource, which you want to delete
		* @returns {Promise} witch resolves if resource had been successfully deleted
		*/
	this.delete = function(context, type_name, id){
			return new Promise.try(function(){
				var resource_type_object = Sealious.ChipManager.get_chip("resource_type", type_name);
				var access_strategy = resource_type_object.get_access_strategy("delete");
				return access_strategy.check(context)
				.then(function(){
					return Sealious.Dispatcher.datastore.remove("resources", {
						sealious_id: id,
						type: type_name
					}, {})
				})
				.then(function(data){
					return Promise.resolve();
				});
			})
		}
	/**
		* Gets a resource of given id
		* @param {Context} context - context
		* @param {String} resource_id - id of particular resource
		* @returns {Promise} which resolves with object representing resource, or rejects if resource with given id is not find
		*/
	this.get_by_id = function(context, resource_id){
			return Promise.try(function(){
		//var access_strategy = resource_type_object.get_access_strategy("get_by_id");

		return Sealious.Dispatcher.datastore.find("resources", {
			sealious_id: resource_id
		}, {})
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
	})
		}
	/**
		* is used to filter in item sensitive access strategies. Returns a function that can be used with Promise.filter
		* @param {Context} context - context in which resource is being created
		* @param {} access_strategy - 
		*/
	function filter_resource_list (context, access_strategy) {
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

	/**
		* Returns list of resources, which match given restriction
		* @param {Context} context - context in which resource is being created
		* @param {Object} field_values - object representing our query ex. field_values.name = "cup" will find all resources, which field name has value "cup"
		* @param {String} type - name of resource type, defined in resource type declaration
		* @returns {Promise} which resolves with array of founded objects
		*/
	this.find = function(context, field_values, type){
			var find_arguments = arguments;
			return Promise.try(function(){
		//throw new Error("ResourceManager.find not implemented.");
		if (find_arguments.length == 2) {
			type = null;
		}
		var query = {};
		if (type){
			query.type = type;
		}
		for (var field_name in field_values){
			query["body." + field_name] = field_values[field_name];
		}
		return Sealious.Dispatcher.datastore.find("resources", query)
		.then(function(documents){
			var parsed_documents = documents.map(function(document){
				return new ResourceRepresentation(document).getData()
			});
			return Promise.resolve(parsed_documents);
		});
	})

		}
	/**
		* Replaces just the provided values. Equivalent of PATCH request
		* @param {Context} context - context in which resource is being created
		* @param {String} type_name - name of resource type, defined in resource type declaration
		* @param {Object} field_values - object representing our query ex. field_values.name = "cup" will find all resources, which field name has value "cup"
		* @param consider_empty_values - if set to true, values from values_to_patch will be deleted. Defaults to false.
		* 
		* @returns {Promise} which resolves with array of founded objects
		*/
	this.update_resource = function(context, type_name, resource_id, body){
	return Promise.try(function(){
		var type = Sealious.ChipManager.get_chip("resource_type", type_name);
		for (var i in type.fields) {
			var field = type.fields[i];
			if (!body.hasOwnProperty(field.name)) {
				body[field.name] = undefined;
			}
		}
		return self.patch_resource(context, type_name, resource_id, body, true);			
	})
}
}


module.exports = ResourceManager;
