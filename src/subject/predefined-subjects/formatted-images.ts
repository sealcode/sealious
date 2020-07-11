import Subject, { NoActionSubject } from "../subject";
import * as Errors from "../../response/errors";
import ImageFormats from "../subject-types/image-formats";
import App from "../../app/app";

export default class UploadedFilesSubject extends NoActionSubject {
	async getChildSubject(path_element: string) {
		return Promise.resolve(new ImageFormats(this.app, path_element));
	}

	getName() {
		return "formatted-images";
	}
}
