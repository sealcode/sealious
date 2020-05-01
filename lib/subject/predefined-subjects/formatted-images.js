const Promise = require("bluebird");

const Subject = require("../subject.js");
const Errors = require("../../response/error.js");

const ImageFormats = require("../subject-types/image-formats.js");

function UploadedFilesSubject(app) {
	this.get_child_subject = function (file_id) {
		return Promise.resolve(new ImageFormats(app, file_id));
	};

	this.perform_action = function (context, action_name, args) {
		throw new Errors.BadSubjectAction(
			"This subject does not provide any actions."
		);
	};
}

UploadedFilesSubject.prototype = Object.create(Subject.prototype);

UploadedFilesSubject.subject_name = "formatted-images";

module.exports = UploadedFilesSubject;
