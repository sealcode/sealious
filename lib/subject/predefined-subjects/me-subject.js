"use strict";
const locreq = require("locreq")(__dirname);
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

const MeSubject = function(app){
	this.perform_action = function(context, action_name, params){
		return app.run_action(context, ["collections", "users", context.user_id], action_name, params)
		.catch({type: "not_found"}, function(error){
			throw new Errors.InvalidCredentials("You're not logged in!");
		});
	};
};

MeSubject.prototype = Object.create(Subject.prototype);

module.exports = MeSubject;
