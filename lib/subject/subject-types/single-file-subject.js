"use strict";
const locreq = require("locreq")(__dirname);
const Subject = locreq("lib/subject/subject.js");
const Errors = locreq("lib/response/error.js");
const FileManager = locreq("lib/core-services/file-manager.js");

const FileHash = function(file_id){
	this.name = "FileHash";
	this.file_id = file_id;
};

FileHash.prototype = Object.create(Subject.prototype);

FileHash.prototype.get_child_subject = function(file_name){
	return new SingleFileSubject(this.file_id, file_name);
};

const SingleFileSubject = function(file_id, file_name){
	this.name = "SingleFile";
	this.file_id = file_id;
	this.file_name = file_name;
};

SingleFileSubject.prototype = Object.create(Subject.prototype);

SingleFileSubject.prototype.perform_action = function(context, action_name, args){
	switch (action_name){
	case "show":
		return FileManager.find(context, {id: this.file_id})
			.then(function(results){
				return results[0];
			});
	default:
		throw new Errors.DeveloperError(`Unknown action for '${this.resource_type.name}' resource: '${action_name}'`);
	}
};



module.exports = FileHash;
