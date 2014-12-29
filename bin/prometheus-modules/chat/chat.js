var Service = require("prometheus-service").Service;

module.exports.prepare_service_chat = function(chat_service, dependencies){
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
		console.log("topmost callback:", callback);
		resourceManager.getResourcesByType("chat-message", {}, function(resources){
			var data = resources.map(function(resource){
				return resource.getData();
			});
			console.log("callback:", callback);
			callback(data);
		});
	});
	chat_service.on("list-conversations", function(payload, callback){
		resourceManager.getResourcesByType("chat-conversation", {}, function(resources){
			var data = resources.map(function(resource){
				return resource.getData();
			});
			callback(data);
		});
	});
}


module.exports.prepare_resource_type_chat_message = function(chat_message){
	chat_message.addFields([
		{name: "from", 		type: "text", required:true},//should be an association to User
		{name: "message", 	type: "text", required: true},
		{name: "date", 		type: "date"},
		{name: "order_in_conversation", type: "int"}
	]);
}


module.exports.prepare_resource_type_chat_conversation = function(chat_conversation){
	chat_conversation.addFields([
		{name: "title", type: "text", required: true},
		{name: "random_number", type: "int"}
	]);
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

module.exports.prepare_channel_www_server = function(www_server, dispatcher){
	www_server.route([
		{
			method: 'GET',
			path: '/api/v1/chat/message',
			handler: function(request, reply){
				dispatcher.resources_list_by_type("chat_message").then(function(resources){
					reply(reources);
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