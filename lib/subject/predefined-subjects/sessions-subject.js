"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const CurrentSessionSubject = require("../subject-types/current-session-subject.js");
const SuperContext = locreq("lib/super-context.js");
const Errors = locreq("lib/response/error.js");
const Responses = locreq("lib/response/responses.js");
const Subject = locreq("lib/subject/subject.js");

function is_auth_data_valid (app, username, password){
	return app.run_action(
		new SuperContext(),
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

function attemp_login (app, context, params){
	let username, password;
	let user;
	let session;
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
		return is_auth_data_valid(app, username, password)
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
	.then(function(user_arg){
		user = user_arg;
		return app.run_action(new SuperContext(), ["collections", "sessions"], "create", {user: user.id, "session-id": null});
	})
	.then(function(session_arg){
		session = session_arg;
		return app.run_action(new SuperContext(), ["collections", "users", user.id], "edit", {last_login_context: context});
	})
	.then(function(){
		return new Responses.NewSession(session.body["session-id"]);
	});
}

const SessionsSubject = function(app){

	this.perform_action = function(context, action_name, params){
		params = params || {};
		switch (action_name){
		case "create":
			return attemp_login(app, context, params);
		default:
			throw new Errors.DeveloperError(`Unknown/unsupported action '${action_name}' for Session Subject.`);

		}
	};

	this.get_child_subject = function(key){
		switch (key){
		case "current":
			return new CurrentSessionSubject();
		default:
			throw new Errors.BadSubjectPath(`No child subject with key '${key}' in SessionSubject`);
		}
	};

};

SessionsSubject.prototype = Object.create(Subject.prototype);

SessionsSubject.subject_name = "sessions";

module.exports = SessionsSubject;
