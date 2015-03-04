var Promise	= require("bluebird");

var Dispatcher 				= require("../dispatcher.js");
var MetadataManager 		= require("../../metadata-manager.js");
var ChipManager 			= require("../../chip-types/chip-manager.js");

var DispatcherLocal= Object.create(Dispatcher.prototype);

DispatcherLocal.process_service_method = function(service, service_name, method_name){
	return service[method_name].bind(service, this);			
}

DispatcherLocal.process_resource_manager_method = function(ResourceManager, method_name){
	return ResourceManager[method_name].bind(ResourceManager, this);
}

DispatcherLocal.fire_service_action = function(service_name, action_name, payload){
	return ChipManager.get_chip("service", service_name).fire_action(action_name, payload);
}

DispatcherLocal.metadata_increment_variable = function(){
	return MetadataManager.increment_variable.apply(MetadataManager, arguments);
}


module.exports = DispatcherLocal;
