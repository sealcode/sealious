const Promise = require("bluebird");

const Subject = require("../subject.js");
const Errors = require("../../response/error.js");

const FileHash = require("../subject-types/single-file-subject.js");

function UploadedFilesSubject(app) {
	this.get_child_subject = function (key) {
		const file_id = key;
		return Promise.resolve(new FileHash(app, file_id));
	};

	this.perform_action = function (context, action_name, args) {
		throw new Errors.BadSubjectAction(
			"This subject does not provide any actions."
		);
	};
}

UploadedFilesSubject.prototype = Object.create(Subject.prototype);

UploadedFilesSubject.subject_name = "uploaded-files";

module.exports = UploadedFilesSubject;
