module.exports = function(chat_message){
	chat_message.add_fields([
		{name: "from", 		type: "text" },//should be an association to User | was "required: true"
		{name: "message", 	type: "text", required: true},
		{name: "date", 		type: "date"},
		{name: "order_in_conversation", type: "int"},
		{name: "conversation_id", type: "int"},
	]);
}