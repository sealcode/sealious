var Service = require("prometheus-service");
var resourceManager = require("prometheus-resource-manager");

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
	chat_service.on("post", function(payload, callback){
		resourceManager.newResource("chat-message", payload, function(response){
			callback(response);
		})
	})
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
				from: {type: "text", required:true},//should be an association to User
				message: {type: "text", required: true},
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

module.exports.construct_associations = function(AssocInterface){
	AssocInterface.create("chat-message", "chat-conversation", true, "is_in_conversation", "contains_messages");
}


/*
	
	channel associations
	
*/

module.exports.channel_setup = function(channel_id, dependencies){
	var www_server = dependencies["channel.www-server"];
	var chat_service = dependencies["service.chat"];
	
	www_server.route(
	{
		method: 'GET',
		path: '/chat/lolo',
		handler: function(request, reply){
			console.log("captured request for nono");
			db_view_service.emit("list", function(data){
				reply(data);
			})
		}
	});
	
	www_server.route(
	{
		method: 'GET',
		path: '/api/v1/chat/post',
		handler: function(request, reply){
			chat_service.emit("post", {message: "heloł mejbi", from: "groovy354@gmail.com"}, function(data){
				reply(data);
			})
		}
	});

}