"use strict";
const locreq = require("locreq")(__dirname);

const Errors = locreq("lib/response/error.js");
const Subject = locreq("lib/subject/subject.js");

const CollectionsSubjectFn = require("./collections-subject.js");
const UsersSubject = require("./users-subject.js");
const SessionsSubject = require("./sessions-subject.js");
const UploadedFilesSubject = require("./uploaded-files.js");

const RootSubject = function(app){
	const CollectionsSubject = new CollectionsSubjectFn(app);
	this.get_child_subject = function(key){
		switch (key){
		case "collections":
			return CollectionsSubject;
		case "users":
			return UsersSubject;
		case "sessions":
			return SessionsSubject;
		case "uploaded-files":
			return UploadedFilesSubject;
		default:
			throw new Errors.BadSubjectPath(`No child subject with key '${key}' in RootSubject`);
		}
	};
};

RootSubject.prototype = Object.create(Subject.prototype);
RootSubject.prototype.name = "Root";

module.exports = RootSubject;
