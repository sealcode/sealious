var Sealious = require("sealious");
var Promise = require("bluebird");
var uuid = require("node-uuid");

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
			throw new Error("User/password mismatch");
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

function attemp_login (params) {
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
		.catch(function(){
			return user_exists(username)
			.then(function(){
				throw new Sealious.Errors.InvalidCredentials("Bad password");
			})
			.catch(function(){
				throw new Sealious.Errors.InvalidCredentials("Bad username");
			})
		})
	})
	.then(function(user){
		var session_id = new_session(user.id);
		return new Sealious.Responses.NewSession(session_id)
	})
}

function get_user_id (context, session_id) {
	if (context instanceof Sealious.SuperContext){
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
				return attemp_login(params);
			case "get_user_id":
				var session_id = params;
				return get_user_id(context, session_id);
			default:
				throw new Sealious.Errors.DeveloperError(`Unknown/unsupported action '${action_name}' for Session Subject.`);

		}
	}

}

SessionsSubject.prototype = Object.create(Sealious.Subject);

module.exports = new SessionsSubject();
