module.exports.prepare_resource_type_contact = function(chat_conversation){
	chat_conversation.add_fields([
		{name: "name", type: "text", required: true},
		{name: "email", type: "text", required: true},
		{name: "phone_number", type:"text"}
	]);
}

module.exports.prepare_channel_rest = function(rest){
	rest.add_path("/api/v1/chat/contacts", "contact");
}

module.exports.prepare_channel_www_server = function(channel){
	channel.static_route("/home/adrian/", "");
}