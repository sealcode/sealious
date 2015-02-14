module.exports = function(chat_conversation){
	chat_conversation.add_fields([
		{name: "title", type: "text", required: true},
		{name: "random_number", type: "int"},
		{name: "user1", type: "reference"},
		{name: "user2", type: "reference"}
	]);
}
