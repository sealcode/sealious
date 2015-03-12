var http = require("request");
var QueryString = require("query-string");
var Promise = require("bluebird");

var config = require("../../config/config-manager.js").getConfiguration();
var MetadataManager = require("../../metadata-manager.js");
var ChipManager = require("../../chip-types/chip-manager.js");
var ResourceManager = require("../../chip-types/resource-manager.js");
var Dispatcher = require("../dispatcher.js");


var DispatcherDistributedBIZ = Object.create(Dispatcher.prototype);

console.log("###############\n    Socket.io started on port " + config.biz_layer_config.port + "\n###############");

function generateUrl() {
    var remote_settings = config.db_layer_config;
    return "http://" + remote_settings.host + ":" + remote_settings.port;
}

DispatcherDistributedBIZ.metadata_increment_variable = function() {
    //in local mode     
    return MetadataManager.increment_variable.apply(MetadataManager, arguments);
}

DispatcherDistributedBIZ.call_service_method = function(service_name, method_name, arguments) {
    new Promise(function(resolve, reject) {
        var service = ChipManager.get_chip("service", service_name);
        resolve(service[method_name].apply(service, arguments));
    });
}

DispatcherDistributedBIZ.process_resource_manager_method = function(ResourceManager, method_name) {
    return ResourceManager[method_name].bind(ResourceManager, this);
}

DispatcherDistributedBIZ.process_service_method = function(service, service_name, method_name) {
    return service[method_name].bind(service, this);
}

DispatcherDistributedBIZ.process_datastore_method = function(datastore, method_name) {
    return function(){
        throw new Error("to be implemented");
    }
}

module.exports = DispatcherDistributedBIZ;
