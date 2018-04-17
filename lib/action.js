"use strict";
const locreq = require("locreq")(__dirname);
const SubjectPath = locreq("lib/data-structures/subject-path.js");
const Promise = require("bluebird");

function Action(RootSubject, subject_path, action_name) {
	this.RootSubject = RootSubject;
	this.subject_path = new SubjectPath(subject_path);
	this.action_name = action_name;
}

Action.pure = {};

Action.curry = function(RootSubject) {
	return function(subject_path, action_name) {
		return new Action(RootSubject, subject_path, action_name);
	};
};

module.exports = Action;
