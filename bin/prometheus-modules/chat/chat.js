var Service = require("prometheus-service");
var resourceManager = require("prometheus-resource-manager");

module.exports.register_services = function(){
	return ["chat"];
}

module.exports.service_info = function(service_name){
	var ret = {};
	if(service_name=="chat"){
		ret["name"] = "Prometheus Distributed Chat System";
		ret["description"] = "The an advanced simple chat image processing service module";
	}
	return ret;
}

module.exports.construct_service = function(service_name){

};