import { NoActionSubject } from "../subject";
import App from "../../app/app";
import { ImageFormat } from "./image-format/image-format";

export default class ImageFormats extends NoActionSubject {
	file_id: string;

	constructor(app: App, file_id: string) {
		super(app);
		this.file_id = file_id;
	}
	getName() {
		return "ImageFormats";
	}

	async getChildSubject(path_element: string) {
		return new ImageFormat(this.app, this.file_id, path_element);
	}
}
