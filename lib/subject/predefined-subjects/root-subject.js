const locreq = require("locreq")(__dirname);

const Errors = locreq("lib/response/error.js");
const Subject = locreq("lib/subject/subject.js");

const ResourcesSubject = require("./resources-subject.js");
const UsersSubject = require("./users-subject.js");
const SessionsSubject = require("./sessions-subject.js");
const UploadedFilesSubject = require("./uploaded-files.js");

const RootSubject = function(){

	this.name = "Root";

	this.get_child_subject = function(key){
		switch (key){
		case "resources":
			return ResourcesSubject;
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

module.exports = new RootSubject();
