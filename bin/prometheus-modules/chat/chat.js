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

function construct_chat_service(){
	var chat_service = new Service();
	//todo
	return chat_service;
}


module.exports.construct_service = function(service_name){
	if(service_name=="chat"){
		return construct_chat_service();
	}
};

/**


	Reosource types


*/

module.exports.construct_resource_type = function(type){
	switch(type){
		case "chat-message":
			return {
				from: {type: "reference.user"},
				to: {type: "reference.user"},
				message: {type: "text"},
				date: {type: "date"},
				order_in_conversation: {type: "int"}

			}
		break;
		case "chat-conversation":
			return {
				title: {type: "text"}
			}
		break;
	}
}

module.exports.construct_associations = function(Assoc){
	Assoc.create("chat-message", "chat-conversation", true, "is_in_conversation", "contains_messages");
}