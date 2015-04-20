var Errors = require("../../response/error.js");

var DispatcherDistributed = require("../dispatcher-distributed.js");

var DispatcherDistributedDB = new DispatcherDistributed("db");


DispatcherDistributedDB.process_resource_manager_method = function(ResourceManager, method_name) {
    return function(){
    	throw new Errors.Error("DispatcherDistributedDB tried to call a ResourceManager method, wchich is not allowed.")
    }
}

DispatcherDistributedDB.process_service_method = function(service, service_name, method_name) {
    return function(){
    	throw new Errors.Error("DispatcherDistributedDB tried to call a service method, wchich is not allowed.")
    }
}

DispatcherDistributedDB.process_datastore_method = function(datastore, method_name) {
    return datastore[method_name];
}

module.exports = DispatcherDistributedDB;
