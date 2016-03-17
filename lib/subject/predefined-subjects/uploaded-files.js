var Sealious = require("sealious");
var Promise = require("bluebird");

var SingleFileSubject = require("../subject-types/single-file-subject.js");

var UploadedFilesSubject = function(){

	this.get_child_subject = function(key){
		var file_id = key;
		return Promise.resolve(new SingleFileSubject(file_id));
	}

	this.perform_action = function(context, action_name, arguments){
		throw new Sealious.Errors.BadSubjecAction("This subject does not provide any actions.");
	}
}

UploadedFilesSubject.prototype = Object.create(Sealious.Subject.prototype)

module.exports = new UploadedFilesSubject();
