import SubjectPath from "./data-structures/subject-path.js";
import Subject from "./subject/subject.js";

export type ActionName = "show" | "create" | "edit" | "replace" | "delete";

export default class Action {
	subject_path: SubjectPath;
	action_name: ActionName;
	RootSubject: Subject;
	constructor(
		RootSubject: Subject,
		subject_path: SubjectPath,
		action_name: ActionName
	) {
		this.RootSubject = RootSubject;
		this.subject_path = new SubjectPath(subject_path);
		this.action_name = action_name;
	}

	static curry(RootSubject: Subject) {
		return function (subject_path: SubjectPath, action_name: ActionName) {
			return new Action(RootSubject, subject_path, action_name);
		};
	}
}
