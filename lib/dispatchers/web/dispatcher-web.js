var DispatcherDistributed = require("../dispatcher-distributed.js");

var DispatcherDistributedWEB = new DispatcherDistributed("web");

DispatcherDistributedWEB.process_core_service_method = function(service, service_name, method_name) {
	return function() {
		return this.call_over_socket(service_name + "." + method_name, arguments);
	}.bind(this);
}

DispatcherDistributedWEB.process_datastore_method = function(datastore, method_name) {
	return function() {
		return this.call_over_socket("datastore." + method_name, arguments);
	}.bind(this);
}

module.exports = DispatcherDistributedWEB;