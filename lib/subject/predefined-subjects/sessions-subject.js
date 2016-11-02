"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");
const uuid = require("node-uuid");

const CurrentSessionSubject = require("../subject-types/current-session-subject.js");
const SuperContext = locreq("lib/super-context.js");
const Errors = locreq("lib/response/error.js");
const Responses = locreq("lib/response/responses.js");
const Subject = locreq("lib/subject/subject.js");

const sessions = {};

function is_auth_data_valid (username, password){
	return new SuperContext()
	.run_action(
		["collections", "users"],
		"show",
		{filter:{username: username, password: password}}
	).then(function(results){
		if (results.length === 1){
			return results[0];
		} else {
			throw new Errors.InvalidCredentials("User/password mismatch");
		}
	});
}

function user_exists (username){
	return new SuperContext()
	.run_action(
		["users", username],
		"show"
	);
}

function new_session (user_id){
	const session_id = uuid.v4();
	sessions[session_id] = user_id;
	return session_id;
}

function attemp_login (context, params){
	let username, password;
	return Promise.try(function(){
		username = params.username;
		password = params.password;
		if (!username){
			throw new Errors.InvalidCredentials("Missing username!");
		}
		if (!password){
			throw new Errors.InvalidCredentials("Missing password!");
		}
	})
	.then(function(){
		return is_auth_data_valid(username, password)
		.catch({type: "not_found"}, function(e){
			return user_exists(username)
			.then(function(){
				throw new Errors.InvalidCredentials("Bad password");
			})
			.catch(Errors.Error, function(e){
				throw new Errors.InvalidCredentials("Bad username");
			});
		});
	})
	.then(function(user){
		const session_id = new_session(user.id);
		return new SuperContext().run_action(["collections", "users", user.id], "edit", {last_login_context: context})
		.then(function(){
			return new Responses.NewSession(session_id);
		});
	});
}

function get_user_id (context, session_id){
	if (context.is_super){
		return sessions[session_id];
	} else {
		throw new Errors.BadContext("You are not allowed to view session data");
	}
}

const SessionsSubject = function(app){

	this.perform_action = function(context, action_name, params){
		params = params || {};
		switch (action_name){
		case "create":
			return attemp_login(context, params);
		case "get_user_id":
			const session_id = params;
			return get_user_id(context, session_id);
		default:
			throw new Errors.DeveloperError(`Unknown/unsupported action '${action_name}' for Session Subject.`);

		}
	};

	this.get_child_subject = function(key){
		switch (key){
		case "current":
			return new CurrentSessionSubject(sessions);
		default:
			throw new Errors.BadSubjectPath(`No child subject with key '${key}' in SessionSubject`);
		}
	};

};

SessionsSubject.prototype = Object.create(Subject.prototype);

SessionsSubject.subject_name = "sessions";

module.exports = SessionsSubject;
