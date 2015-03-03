var Promise	= require("bluebird");

var Dispatcher 				= require("../dispatcher.js");
var MetadataManager 		= require("../../metadata-manager.js");
var ResourceManager 		= require("../../chip-types/resource-manager.js");
var ChipManager 			= require("../../chip-types/chip-manager.js");

var DispatcherLocal = new function(){

	var me = this;

	this.init = function(){
		me.datastore = ChipManager.get_datastore_chip();
		var services = ChipManager.get_chips_by_type("service");
		me.services = {};
		for(var service_name in services){
			console.log("service_name:", service_name);
			var service = services[service_name];
			me.services[service_name] = {};
			for(var method_name in service){
				if(service[method_name] instanceof Function){
					me.services[service_name][method_name] = service[method_name].bind(service, me);					
				}
			}
		}
	}

//biz (copied) + web (copied)
	this.resources_list_by_type = function(type_name, params){
		return ResourceManager.list_by_type(type_name, params, this)
	}

	this.resources_create = function(type_name, body, owner){
		//console.log("DispatcherLocal, create", arguments, "body:", body, "owner", owner);
		return ResourceManager.create_resource(type_name, body, owner, this);
	}

	this.resources_update = function(resource_id, new_data){
		return ResourceManager.update_resource(resource_id, new_data, this);
	}
	this.resources_edit_resource_access_mode = function(resource_id, access_mode, access_mode_args){	
		return ResourceManager.edit_resource_access_mode(resource_id, access_mode, access_mode_args, this);	
	}
	this.resources_delete = function(type_name, body){
		return ResourceManager.delete_resource(type_name, body, this);
	}

	this.resources_get_by_id = function(resource_id){
		return ResourceManager.get_resource_by_id(resource_id, this);
	}

	this.resources_find = function(field_values, type){
		return ResourceManager.find_resource(field_values, type, this);
	}

	this.resources_get_access_mode = function(resource_id){
		return ResourceManager.get_resource_access_mode(resource_id, this);
	}

	this.resources_search_resource = function(type, field_name, query_string){
		return ResourceManager.search_resource(type, field_name, query_string, this);
	}

	this.resources_search_by_mode = function(type, mode){
		return ResourceManager.search_by_mode(type, mode, this);
	}

	this.resources_get_signature = function(resource_type_name){
		return ResourceManager.get_resource_type_signature(resource_type_name);
	}

	this.fire_service_action = function(service_name, action_name, payload){
		return ChipManager.get_chip("service", service_name).fire_action(action_name, payload);
	}

	this.metadata_increment_variable = function(){
		return MetadataManager.increment_variable.apply(MetadataManager, arguments);
	}
}

module.exports = DispatcherLocal;
