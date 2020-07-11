import SubjectPath, { SubjectPathEquiv } from "../data-structures/subject-path";
import { ActionName } from "../action";
import Context from "../context";
import App from "../app/app";
import * as Errors from "./../response/errors";

export default abstract class Subject {
	name: string;
	app: App;

	constructor(app: App) {
		this.app = app;
	}

	abstract getName(): string;

	abstract async getChildSubject(
		path_element: string
	): Promise<Subject | null>;

	abstract async performAction(
		context: Context,
		action_name: ActionName,
		params: any
	): Promise<any>;

	async getSubject(
		subject_path_equiv: SubjectPathEquiv
	): Promise<Subject | null> {
		// This is a recursive function. It traverses the subject tree and returns
		// the subject referenced by  subject_path
		const subject_path = new SubjectPath(subject_path_equiv);
		const child_subject = await this.getChildSubject(subject_path.head());
		if (subject_path.elements.length === 1) {
			return child_subject;
		} else {
			if (child_subject === null) {
				return null;
			}
			return child_subject.getSubject(subject_path.tail());
		}
	}
}

export abstract class LeafSubject extends Subject {
	async getChildSubject() {
		return null;
	}
}

export abstract class NoActionSubject extends Subject {
	async performAction() {
		throw new Errors.BadSubjectAction(
			"This subject pdoes not provide any actions."
		);
	}
}
