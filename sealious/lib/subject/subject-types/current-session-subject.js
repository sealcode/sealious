"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const Response = locreq("lib/response/response.js");
const Errors = locreq("lib/response/error.js");
const Subject = locreq("lib/subject/subject.js");
const SuperContext = locreq("lib/super-context.js");

const CurrentSession = function(app){
	this.app = app;
};

CurrentSession.prototype = Object.create(Subject.prototype);

CurrentSession.prototype.perform_action = function(context, action_name, args){
	const self = this;
	switch (action_name){
	case "delete":
		return self.app.run_action(
			new SuperContext(),
			["collections", "sessions"],
			"show",
			{filter: {"session-id": context.session_id}}
		)
		.each(function(result){
			return self.app.run_action(new SuperContext(), ["collections", "sessions", result.id], "delete");
		})
		.then(function(){
			return self.app.run_action(
				new SuperContext(),
				["collections", "anonymous-sessions"],
				"show",
				{
					filter: {"anonymous-session-id": context.anonymous_session_id},
				}
			);
		})
		.each(function(anon_session){
			return self.app.run_action(new SuperContext(), ["collections", "anonymous-sessions", anon_session.id], "delete");
		})
		.then(function(){
			return Promise.resolve(new Response({}, false, "logged_out", "You've been logged out"));
		})
		.catch(function(error){
			return Promise.reject(new Errors.BadContext("Invalid session id!"));
		});
	default:
		throw new Errors.DeveloperError(`Unknown action ${action_name} for CurrentSession subject.`);
	}
};

module.exports = CurrentSession;
