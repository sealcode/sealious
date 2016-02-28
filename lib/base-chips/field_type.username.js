var Sealious = require("sealious");

module.exports = new Sealious.FieldType({
	name: "username",
	extends: "text",
	is_proper_value: function(accept, reject, context, params, new_value, old_value){
		if (old_value === new_value){
			accept();
		} else {
			Sealious.run_action(new Sealious.SuperContext(context), ["resources", "user"], "show", {username: new_value})
			.then(function(results){
				if (results.length === 0){
					accept();
				} else {
					reject("Username already taken");
				}
			})
		}
	}
})
