var Sealious = require("../main.js");
var user = new Sealious.ChipTypes.ResourceType({
	name: "user",
	fields:[
		{name: "username", type: "text", required: true},
		{name: "email", type: "email"},
		{name: "password", type: "text", required: true},
		{name: "status", type: "text"},
		{name:"username", type:"text"}
	]
});

