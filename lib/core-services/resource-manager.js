var Sealious = require("sealious");
var Promise = require("bluebird");
var ResourceRepresentation = require("../resource-representation.js");

var assert = require("assert");

var UUIDGenerator = require("uid");

var ResourceManager = new function(){
	this.name = "resources";
	var self = this;

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

	this.find = function(context, field_values, type){
		var find_arguments = arguments;
		return Promise.try(function(){
			if (find_arguments.length === 2) {
				type = null;
			}
			var query = {};
			if (type){
				query.type = type;
			}
			for (var field_name in field_values){
				query["body." + field_name] = field_values[field_name];
			}
			return Sealious.Datastore.find("resources", query)
			.then(function(documents){
				var parsed_documents = documents.map(function(document){
					return new ResourceRepresentation(type, document)
				});
				return Promise.resolve(parsed_documents);
			});
		})

	}

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
