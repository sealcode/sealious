var Sealious = require("sealious");
var Promise = require("bluebird");

var me_synonyms = require("../../misc/me-synonyms.json");
var MeSubject = require("./me-subject.js");

function password_match (context, username, password) {
	return new Promise(function(resolve, reject){
		var err;
		if (!username && !password) {
			err = new Sealious.Errors.InvalidCredentials("Missing username and password!");
			reject(err);
		} else if (!password) {
			err = new Sealious.Errors.InvalidCredentials("Missing password!");
			reject(err);
		} else if (!username) {
			err = new Sealious.Errors.InvalidCredentials("Missing username!");
			reject(err);
		} else {
			var user_rt = Sealious.ChipManager.get_chip("resource_type", "user");
			var password_field = user_rt.fields.password;
			password_field.encode_value(context, password)
			.then(function(password_hash){
				var query = {
					type: "user",
					body: {
						username: username,
						password: password_hash
					}
				};
				Sealious.Datastore.find("resources", query)
				.then(function(result){
					if (result[0]) {
						resolve(result[0].sealious_id);
					} else {
						var err = new Sealious.Errors.InvalidCredentials("Wrong username or password!");
						reject(err);
					}
				})
			})
		}
	})
}

var UsersSubject = function(){
	this.perform_action = function(context, action_name, params){
		params = params || {};
		switch (action_name){
			case "create":
				return Sealious.run_action(context, ["resources", "user"], "create", params);
			case "show":
				return Sealious.run_action(context, ["resources", "user"], "show", params);
			default:
				return Promise.reject(new Sealious.Errors.BadSubjectAction(`Unknown action for UsersSubject: '${action_name}'`));
		}
	}

	this.get_child_subject = function(key){
		if (me_synonyms.indexOf(key) !== -1){
			return MeSubject;
		} else {
			var username = key;
			return Sealious.run_action(new Sealious.SuperContext(), ["resources", "user"], "show", {filter:{username:username}})
			.then(function(result){
				if (result.length === 0){
					throw new Sealious.Errors.BadSubjectPath(`Unknown username: '${username}'`)
				} else {
					var user = result[0];
					return Sealious.RootSubject.get_subject(["resources", "user", user.id])
				}
			})
		}
	}
}

UsersSubject.prototype = Object.create(Sealious.Subject.prototype);

module.exports = new UsersSubject();
