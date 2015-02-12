var path = require("path");

module.exports.prepare_resource_type_contact = function(chat_conversation){
	chat_conversation.add_fields([
		{name: "name", type: "text", required: true},
		{name: "email", type: "email", required: true},
		{name: "phone_number", type:"text"}
	]);
}

module.exports.prepare_channel_rest = function(rest){
	rest.add_path("/api/v1/chat/contacts", "contact");
	// rest wie, żeby powiązać ten url z tym typem zasobu i na nim wywoływać GET i POST
}

module.exports.prepare_channel_www_server = function(channel){
	var public_dir = path.resolve(module.filename, "../../../public");
	channel.static_route(public_dir, "");
}




/*
1. contact-list.js
2. rest.js
3. www-server.js
4. dispatcher-web
5. dispatcher-biz
6. dispatcher-db
*/