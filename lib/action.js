"use strict";
const locreq = require("locreq")(__dirname);
const SubjectPath = locreq("lib/data-structures/subject-path.js");
const Promise = require("bluebird");

function Action (RootSubject, subject_path, action_name){
	this.RootSubject = RootSubject;
	this.subject_path = new SubjectPath(subject_path);
	this.action_name = action_name;
}

Action.pure = {};

Action.pure.perform = function(RootSubject, subject_path, action_name, context, args){
	return Promise.try(function(){
		return RootSubject.get_subject(subject_path)
		.then(function(subject){
			return subject.perform_action(context, action_name, args);
		});
	});
};

Action.prototype.perform = Action.prototype.run = function(context, args){
	return Action.pure.perform(this.RootSubject, this.subject_path, this.action_name, context, args);
};

Action.curry = function(RootSubject){
	return function(subject_path, action_name){
		return new Action(RootSubject, subject_path, action_name);
	};
};

module.exports = Action;
