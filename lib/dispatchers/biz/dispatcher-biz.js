var DispatcherDistributed = require("../dispatcher-distributed.js");

var DispatcherDistributedBIZ = new DispatcherDistributed("biz");


DispatcherDistributedBIZ.process_resource_manager_method = function(ResourceManager, method_name) {
    return ResourceManager[method_name].bind(ResourceManager, this);
}

DispatcherDistributedBIZ.process_service_method = function(service, service_name, method_name) {
    return service[method_name].bind(service, this);
}

DispatcherDistributedBIZ.process_datastore_method = function(datastore, method_name) {
    return function(){
        return this.call_over_socket("datastore."+ method_name, arguments);
    }.bind(this);
}

module.exports = DispatcherDistributedBIZ;
