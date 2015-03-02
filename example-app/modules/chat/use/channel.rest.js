module.exports = function(rest){
	rest.add_path("/api/v1/chat/message", "chat_message");
	rest.add_path("/api/v1/chat/conversation", "chat_conversation");
	rest.add_path("/api/v1/chat/contacts", "contact");
}