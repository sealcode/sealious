var Service = require("prometheus-service");
var resourceManager = require("prometheus-resource-manager");

module.exports.service_info = function(service_name){
	var ret = {};
	if(service_name=="chat"){
		ret.name = "Prometheus Distributed Chat System";
		ret.description = "The an advanced simple chat image processing service module";
	}
	return ret;
}

function construct_chat_service(){
	var chat_service = new Service();
	//todo
	chat_service.on("new-conversation", function(payload, callback){
		resourceManager.newResource("chat-conversation", payload).then(
			function(resource){
				console.log(resource);
				callback(resource.getData());
			},
			function(error){
				callback(error);
			}
		);
	});
	chat_service.on("new-message", function(payload, callback){
		resourceManager.newResource("chat-message", payload).then(
			function(resource){
				console.log(resource);
				callback(resource.getData());
			},
			function(error){
				callback(error);
			}
		);
	});
	chat_service.on("list-messages", function(payload, callback){
		resourceManager.getResourcesByType("chat-message", {}, function(resources){
			var data = resources.map(function(resource){
				return resource.getData();
			});
			callback(data);
		});
	})
	chat_service.on("list-conversations", function(payload, callback){
		resourceManager.getResourcesByType("chat-conversation", {}, function(resources){
			var data = resources.map(function(resource){
				return resource.getData();
			});
			callback(data);
		});
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
				title: {type: "text", required: true},
				random_number: {type: "int"}
			}
			break;
		}
	}

	module.exports.construct_associations = function(AssocInterface){
		AssocInterface.create({
			left_type: "chat-message", 
			right_type: "chat-conversation", 
			bidirectional: true, 
			name_ltr: "is_in_conversation", 
			name_rtl: "contains_messages",
			left_required: true
		});
	}


/*
	
	channel associations
	
	*/

module.exports.channel_setup = function(channel_id, dependencies){
	var www_server = dependencies["channel.www-server"];
	var chat_service = dependencies["service.chat"];
	www_server.route([
		{
			method: 'GET',
			path: '/api/v1/chat/message',
			handler: function(request, reply){
				chat_service.emit("list-messages", function(data){
					reply("<pre>" + JSON.stringify(data, null, "\t") + "</pre>");
				})
			}
		},
		{
			method: 'POST',
			path: '/api/v1/chat/message',
			handler: function(request, reply){
				console.log("payload:", request.payload);
				chat_service.emit("new-message", request.payload, function(data){
					reply("<pre>" + JSON.stringify(data, null, "\t") + "</pre>");
				})
			}
		},
		{
			method: 'GET',
			path: '/api/v1/chat/conversation',
			handler: function(request, reply){
				chat_service.emit("list-conversations", function(data){
					reply("<pre>" + JSON.stringify(data, null, "\t") + "</pre>");
				})
			}
		},
		{
			method: 'POST',
			path: '/api/v1/chat/conversation',
			handler: function(request, reply){
				chat_service.emit("new-conversation", request.payload, function(data){
					reply("<pre>" + JSON.stringify(data, null, "\t") + "</pre>");
				})
			}
		}
	]);

}