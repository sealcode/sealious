"use strict";
const locreq = require("locreq")(__dirname);
const Promise = require("bluebird");

const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");

const SingleFileSubject = locreq("lib/subject/subject-types/single-file-subject.js");

const UploadedFilesSubject = function(){

	this.get_child_subject = function(key){
		const file_id = key;
		return Promise.resolve(new SingleFileSubject(file_id));
	};

	this.perform_action = function(context, action_name, arguments){
		throw new Errors.BadSubjecAction("This subject does not provide any actions.");
	};
};

UploadedFilesSubject.prototype = Object.create(Subject.prototype);

module.exports = new UploadedFilesSubject();
