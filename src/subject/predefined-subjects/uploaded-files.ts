import { NoActionSubject } from "../subject";
import App from "../../app/app";
import Context from "../../context";
import * as Errors from "../../response/errors";

const FileHash = require("../subject-types/single-file-subject.js");

export default class UploadedFilesSubject extends NoActionSubject {
	async getChildSubject(path_element: string) {
		const file_id = path_element;
		return new FileHash(this.app, file_id);
	}

	getName() {
		return "uploaded-files";
	}
}
