module.exports.prepare_resource_type_user = function(user_type, dependencies){
	user_type.add_fields([
		{name: "username", 		type: "text", required: true},//should be an association to User
		{name: "email", 	type: "text", required: true}
	]);
}