module.exports = function(user, dispatcher, dependencies){
	user.add_fields([
		{name: "username", type: "text", required: true},
		{name: "email", type: "email"},
		{name: "status", type: "text"},
		{name:"username", type:"text"}
	]);
}