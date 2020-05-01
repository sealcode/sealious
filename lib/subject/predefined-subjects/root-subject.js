const Errors = require("../../response/error.js");
const Subject = require("../subject.js");

const CollectionsSubjectFn = require("./collections-subject.js");
const SessionsSubjectFn = require("./sessions-subject.js");
const UsersSubjectFn = require("./users-subject.js");
const UploadedFilesSubjectFn = require("./uploaded-files.js");
const SpecificationsSubjectFn = require("./specifications.js");
const FormattedImagesSubjectFn = require("./formatted-images.js");

const child_subjects_generators = [
	CollectionsSubjectFn,
	SessionsSubjectFn,
	UsersSubjectFn,
	UploadedFilesSubjectFn,
	SpecificationsSubjectFn,
	FormattedImagesSubjectFn,
];

const RootSubject = function (app) {
	const child_subjects = {};

	child_subjects_generators.forEach((subjectFn) => {
		child_subjects[subjectFn.subject_name] = new subjectFn(app);
	});

	this.get_child_subject = function (key) {
		const ret = child_subjects[key];
		if (ret === undefined) {
			throw new Errors.BadSubjectPath(
				`No child subject with key '${key}' in RootSubject`
			);
		} else {
			return ret;
		}
	};
};

RootSubject.prototype = Object.create(Subject.prototype);
RootSubject.prototype.name = "Root";

module.exports = RootSubject;
