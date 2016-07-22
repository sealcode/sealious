var Sealious = require("sealious");

var ResourcesSubject = require("./resources-subject.js");
var UsersSubject = require("./users-subject.js");
var SessionsSubject = require("./sessions-subject.js");
var UploadedFilesSubject = require("./uploaded-files.js");

var RootSubject = function(){

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
				throw new Sealious.Errors.BadSubjectPath(`No child subject with key '${key}' in RootSubject`)
		}
	}
}

RootSubject.prototype = Object.create(Sealious.Subject.prototype)

module.exports = new RootSubject();
