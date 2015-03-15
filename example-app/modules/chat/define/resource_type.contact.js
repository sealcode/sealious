module.exports = function(contact){
	contact.add_fields([
		{name: "name", type: "text", required: true},
		{name: "email", type: "email", required: true},
		{name: "phone_number", type:"text"}
	]);
}