var Sealious = require("../main.js");
var user = new Sealious.ChipTypes.ResourceType({
	name: "user",
	human_readable_name: "User",
	human_readable_description: "This resource type was created for handling users, it allows users to set up accounts. After creating an account, the user will be able to login to the your application.",
	fields:[
		{name: "username", type: "text", required: true},
		{name: "email", type: "email"},
		{name: "password", type: "text", required: true},
		{name: "status", type: "text"},
	]
});

