module.exports = function(user_data, dispatcher, dependencies){
	user_data.add_fields([
		{name: "email", type: "text"},
		{name: "status", type: "text"},
		{name:"username", type:"text"}
	]);
}