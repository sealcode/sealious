var DispatcherDistributed = require("../dispatcher-distributed.js");

var DispatcherDistributedDB = new DispatcherDistributed("db");


DispatcherDistributedDB.process_core_service_method = function(service, service_name, method_name) {
	return function() {
		throw new Sealious.Errors.Error("DispatcherDistributedDB tried to call a core-service method, which is not allowed.")
	}
}

DispatcherDistributedDB.process_datastore_method = function(datastore, method_name) {
	return datastore[method_name];
}

module.exports = DispatcherDistributedDB;