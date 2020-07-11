import App from "../../app/app";
import * as Errors from "../../response/errors";
import { NoActionSubject, LeafSubject } from "../subject";
import Context from "../../context";
import { ShowActionName } from "../../action";
import { File } from "../../main";

export default class FileHash extends NoActionSubject {
	file_id: string;

	constructor(app: App, file_id: string) {
		super(app);
		this.file_id = file_id;
	}
	getName() {
		return "FileHash";
	}
	async getChildSubject(path_element: string) {
		return new SingleFileSubject(this.app, this.file_id, path_element);
	}
}

class SingleFileSubject extends LeafSubject {
	file_id: string;
	file_name: string;

	constructor(app: App, file_id: string, file_name: string) {
		super(app);
		this.file_id = file_id;
		this.file_name = file_name;
	}
	getName() {
		return "SingleFile";
	}
	async performAction(_: Context, action_name: ShowActionName, __?: any) {
		if (action_name !== "show") {
			throw new Errors.DeveloperError(
				`Unknown action for '${this.name}' subject: '${action_name}'`
			);
		}

		return await File.fromID(this.app, this.file_id);
	}
}
