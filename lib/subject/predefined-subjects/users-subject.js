"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

const me_synonyms = require("../../misc/me-synonyms.json");
const MeSubject = require("./me-subject.js");
const RootSubject = locreq("lib/subject/predefined-subjects/root-subject.js");
const SuperContext = locreq("lib/super-context.js");

const UsersSubject = function(){
	this.perform_action = function(context, action_name, params){
		params = params || {};
		switch (action_name){
		case "create":
			return context.run_action(["resources", "user"], "create", params);
		case "show":
			return context.run_action(["resources", "user"], "show", params);
		default:
			return Promise.reject(new Errors.BadSubjectAction(`Unknown action for UsersSubject: '${action_name}'`));
		}
	};

	this.get_child_subject = function(key){
		if (me_synonyms.indexOf(key) !== -1){
			return MeSubject;
		} else {
			const username = key;
			return new SuperContext().run_action(["resources", "user"], "show", {filter:{username:username}})
			.then(function(result){
				if (result.length === 0){
					throw new Errors.BadSubjectPath(`Unknown username: '${username}'`);
				} else {
					const user = result[0];
					return RootSubject.get_subject(["resources", "user", user.id]);
				}
			});
		}
	};
};

UsersSubject.prototype = Object.create(Subject.prototype);

module.exports = new UsersSubject();
