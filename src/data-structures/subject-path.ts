import clone from "clone";

export type SubjectPathEquiv = string[] | string | SubjectPath;

export default class SubjectPath {
	elements: string[] = [];
	constructor(subject_path: SubjectPathEquiv) {
		if (subject_path instanceof SubjectPath) {
			this.fromPath(subject_path);
		} else if (typeof subject_path === "string") {
			this.fromString(subject_path);
		} else if (subject_path instanceof Array) {
			this.fromArray(subject_path);
		}
	}

	fromString(path: string) {
		this.elements = path.split(".");
	}

	fromArray(path: string[]) {
		this.elements = clone(path);
	}

	fromPath(path: SubjectPath) {
		this.elements = clone(path.elements);
	}

	clone() {
		const cloned_elements = clone(this.elements);
		return new SubjectPath(cloned_elements);
	}

	tail() {
		return new SubjectPath(this.elements.slice(1));
	}

	head() {
		return this.elements[0];
	}
}
