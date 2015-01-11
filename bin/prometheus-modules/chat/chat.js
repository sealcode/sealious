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
	chat_message.add_fields([
		{name: "from", 		type: "text", required:true},//should be an association to User
		{name: "message", 	type: "text", required: true},
		{name: "date", 		type: "date"},
		{name: "order_in_conversation", type: "int"}
	]);
}


module.exports.prepare_resource_type_chat_conversation = function(chat_conversation){
	chat_conversation.add_fields([
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

module.exports.prepare_channel_rest = function(rest){
	rest.add_path("/api/v1/chat/message", "chat_message");
	rest.add_path("/api/v1/chat/conversation", "chat_conversation");
}
