var Sealious = require("sealious");
var Promise = require("bluebird");
var uuid = require("node-uuid");

var CurrentSessionSubject = require("../subject-types/current-session-subject.js");

var sessions = {};

function is_auth_data_valid (username, password) {
	return Sealious.run_action(
		new Sealious.SuperContext(),
		["resources", "user"],
		"show",
		{filter:{username: username, password: password}}
	).then(function(results){
		if (results.length === 1){
			return results[0];
		} else {
			throw new Sealious.Errors.InvalidCredentials("User/password mismatch");
		}
	})
}

function user_exists (username) {
	return Sealious.run_action(
		new Sealious.SuperContext(),
		["users", username],
		"show"
	);
}

function new_session (user_id) {
	var session_id = uuid.v4();
	sessions[session_id] = user_id;
	return session_id;
}

function attemp_login (context, params) {
	var username, password;
	return Promise.try(function(){
		username = params.username;
		password = params.password;
		if (!username){
			throw new Sealious.Errors.InvalidCredentials("Missing username!");
		}
		if (!password){
			throw new Sealious.Errors.InvalidCredentials("Missing password!");
		}
	})
	.then(function(){
		return is_auth_data_valid(username, password)
		.catch({type: "not_found"}, function(e){
			return user_exists(username)
			.then(function(){
				throw new Sealious.Errors.InvalidCredentials("Bad password");
			})
			.catch(Sealious.Error, function(e){
				throw new Sealious.Errors.InvalidCredentials("Bad username");
			})
		})
	})
	.then(function(user){
		var session_id = new_session(user.id);
		return new Sealious.SuperContext().run_action(["resources", "user", user.id], "edit", {last_login_context: context})
		.then(function(){
			return new Sealious.Responses.NewSession(session_id);
		});
	})
}

function get_user_id (context, session_id) {
	if (context.is_super){
		return sessions[session_id];
	} else {
		throw new Sealious.Errors.BadContext("You are not allowed to view session data");
	}
}

var SessionsSubject = function(){

	this.perform_action = function(context, action_name, params){
		var params = params || {};
		switch (action_name){
			case "create":
				return attemp_login(context, params);
			case "get_user_id":
				var session_id = params;
				return get_user_id(context, session_id);
			default:
				throw new Sealious.Errors.DeveloperError(`Unknown/unsupported action '${action_name}' for Session Subject.`);

		}
	}

	this.get_child_subject = function(key){
		switch (key){
			case "current":
				return new CurrentSessionSubject(sessions);
			default:
				throw new Sealious.Errors.BadSubjectPath(`No child subject with key '${key}' in SessionSubject`)
		}
	}

}

SessionsSubject.prototype = Object.create(Sealious.Subject.prototype);

module.exports = new SessionsSubject();
