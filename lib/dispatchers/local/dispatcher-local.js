var Promise	= require("bluebird");

var Dispatcher 				= require("../dispatcher.js");
var MetadataManager 		= require("../../metadata-manager.js");

var DispatcherLocal= Object.create(Dispatcher.prototype);

DispatcherLocal.process_service_method = function(service, service_name, method_name){
	return service[method_name].bind(service, this);			
}

DispatcherLocal.process_resource_manager_method = function(ResourceManager, method_name){
	return ResourceManager[method_name].bind(ResourceManager, this);
}

DispatcherLocal.process_datastore_method = function(datastore_chip, method_name){
	return datastore_chip[method_name].bind(datastore_chip);
}

DispatcherLocal.metadata_increment_variable = function(){
	return MetadataManager.increment_variable.apply(MetadataManager, arguments);
}


module.exports = DispatcherLocal;
