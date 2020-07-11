import Context from "../../context";
import App from "../../app/app";
import { LooseObject } from "../types";

export default abstract class AttachmentLoader {
	context: Context;
	field_name: string;

	constructor(context: Context, field_name: string) {
		this.context = context;
		this.field_name = field_name;
	}

	abstract async loadTo(
		app: App,
		attachments: LooseObject,
		fieldsWithAttachments: LooseObject
	): Promise<void>;
}
