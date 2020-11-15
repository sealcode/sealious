import * as Errors from "../../response/errors";
import Subject from "../subject";

import CollectionsSubjectFn from "./collections-subject";
import SessionsSubjectFn from "./sessions-subject";
import UsersSubjectFn from "./users-subject";
import UploadedFilesSubjectFn from "./uploaded-files";
import FormattedImagesSubjectFn from "./formatted-images";
import App from "../../app/app";

const child_subjects_generators = [
	CollectionsSubjectFn,
	SessionsSubjectFn,
	UsersSubjectFn,
	UploadedFilesSubjectFn,
	FormattedImagesSubjectFn,
];

export default class RootSubject extends Subject {
	child_subjects: { [subject_name: string]: Subject };
	constructor(app: App) {
		super(app);
		this.child_subjects = {};

		child_subjects_generators.forEach((subjectFn) => {
			const subject = new subjectFn(app);
			this.child_subjects[subject.getName()] = subject;
		});
	}
	getName = () => "root";
	async getChildSubject(path_element: string) {
		const ret = this.child_subjects[path_element];
		if (ret === undefined) {
			throw new Errors.BadSubjectPath(
				`No child subject with key '${path_element}' in RootSubject`
			);
		} else {
			return ret;
		}
	}

	async performAction() {
		return null;
	}
}
