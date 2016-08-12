"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const Response = locreq("lib/response/response.js");
const Errors = locreq("lib/response/error.js");
const Subject = locreq("lib/subject/subject.js");

const CurrentSession = function(all_sessions){
	this.all_sessions = all_sessions;
};

CurrentSession.prototype = Object.create(Subject);

CurrentSession.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
	case "delete":
		if (this.all_sessions[context.session_id]){
			delete this.all_sessions[context.session_id];
			return Promise.resolve(new Response({}, false, "logged_out", "You've been logged out"));
		} else {
			return Promise.reject(new Errors.BadContext("Invalid session id!"));
		}
	default:
		throw new Errors.DeveloperError(`Unknown action ${action_name} for CurrentSession subject.`);
	}
};

module.exports = CurrentSession;
