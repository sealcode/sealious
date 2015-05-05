var Promise	= require("bluebird");

var Dispatcher 				= require("../dispatcher.js");

var DispatcherLocal= Object.create(Dispatcher.prototype);

DispatcherLocal.process_core_service_method = function(service, service_name, method_name){
	return service[method_name].bind(service, this);			
}


DispatcherLocal.process_file_manager_method = function(FileManager, method_name){
	return FileManager[method_name].bind(FileManager, this);
}


DispatcherLocal.process_datastore_method = function(datastore_chip, method_name){
	return datastore_chip[method_name].bind(datastore_chip);
}



module.exports = DispatcherLocal;
