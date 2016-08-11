"use strict";
const locreq = require("locreq")(__dirname);
const SubjectPath = locreq("lib/data-structures/subject-path.js");
const RootSubject = locreq("lib/subject/predefined-subjects/root-subject.js");
const Promise = require("bluebird");

function Action (subject_path, action_name){
	this.subject_path = new SubjectPath(subject_path);
	this.action_name = action_name;
}

Action.prototype.perform = Action.prototype.run = function(context){
	const self = this;
	const args = Array.prototype.slice.call(arguments, 1);

	return Promise.try(function(){
		return RootSubject.get_subject(self.subject_path)
		.then(function(subject){
			return subject.perform_action.apply(subject, [context, self.action_name].concat(args));
		});
	});
};



module.exports = Action;
