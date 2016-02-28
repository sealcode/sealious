var Sealious = require("sealious");
var Promise = require("bluebird");
var uuid = require("node-uuid");

var sessions = {};

function is_auth_data_valid (username, password) {
	return Sealious.run_action(
		new Sealious.SuperContext(),
		["resources", "user"],
		"show",
		{username: username, password: password}
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
				throw new Sealious.Error.InvalidCredentials("Bad username");
			})
		})
	})
	.then(function(user){
		var session_id = new_session(user.id);
		return new Sealious.Responses.NewSession(session_id)
	})
}

var SessionsSubject = function(){

	this.perform_action = function(context, action_name, params){
		var params = params || {};
		if (action_name == "create"){
			return attemp_login(params);
		} else {
			throw new Sealious.Errors.DeveloperError(`Unknown/unsupported action '${action_name}' for Session Subject.`);
		}
	}

}

SessionsSubject.prototype = Object.create(Sealious.Subject);

module.exports = new SessionsSubject();
