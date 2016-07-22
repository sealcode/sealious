var Sealious = require("sealious");
var Promise = require("bluebird");

var CurrentSession = function(all_sessions){
	this.all_sessions = all_sessions
}

CurrentSession.prototype = Object.create(Sealious.Subject);

CurrentSession.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
		case "delete":
			if (this.all_sessions[context.session_id]){
				delete this.all_sessions[context.session_id];
				return Promise.resolve(new Sealious.Response({}, false, "logged_out", "You've been logged out"));
			} else {
				return Promise.reject(new Sealious.Errors.BadContext("Invalid session id!"));
			}
		default:
			throw new Sealious.Errors.DeveloperError(`Unknown action ${action_name} for CurrentSession subject.`);
			break;
	}
}

module.exports = CurrentSession;
