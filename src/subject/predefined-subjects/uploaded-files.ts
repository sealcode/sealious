import { NoActionSubject } from "../subject";

import FileHash from "../subject-types/single-file-subject";

export default class UploadedFilesSubject extends NoActionSubject {
	async getChildSubject(path_element: string) {
		const file_id = path_element;
		return new FileHash(this.app, file_id);
	}

	getName() {
		return "uploaded-files";
	}
}
