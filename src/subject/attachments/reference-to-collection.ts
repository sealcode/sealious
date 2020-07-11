import AttachmentLoader from "./attachment-loader";
import Context from "../../context";
import App from "../../app/app";
import { Document } from "../../data-structures/document";
import { LooseObject } from "../types";

export type ReferenceToCollectionConstructorParams = {
	collection_name: string;
	attachments_query: object;
	documents: Array<Document>;
};

export default class ReferenceToCollection extends AttachmentLoader {
	collection_name: string;
	attachments_query: object;
	documents: Array<Document>;

	constructor(
		context: Context,
		field_name: string,
		{
			collection_name,
			attachments_query,
			documents,
		}: ReferenceToCollectionConstructorParams
	) {
		super(context, field_name);
		this.context = context;
		this.field_name = field_name;
		this.documents = documents;
		this.collection_name = collection_name;
		this.attachments_query = attachments_query; // which fields should get attachments, as well
	}
	async loadTo(
		app: App,
		attachments: LooseObject,
		fieldsWithAttachments: LooseObject
	): Promise<any> {
		const ids = Array.from(this._extractIds());
		const responses = await Promise.all(
			ids.map((id: string) =>
				app.runAction(
					this.context,
					["collections", this.collection_name, id],
					"show",
					this._getActionParams(this.attachments_query)
				)
			)
		);

		for (let response of responses) {
			Object.assign(attachments, response.getAttachments());
			response.items.forEach((document: Document) => {
				attachments[document.id] = document;
			});
			const submetadata = response.getMetadata();

			fieldsWithAttachments[this.field_name] = {};
			if (submetadata) {
				Object.assign(
					fieldsWithAttachments[this.field_name],
					submetadata
				);
			}
		}
	}
	_extractIds() {
		const ids = new Set();
		for (let document of this.documents) {
			if (Array.isArray(document[this.field_name])) {
				for (let id of document[this.field_name]) {
					ids.add(id);
				}
			} else {
				ids.add(document[this.field_name]);
			}
		}
		return ids;
	}
	_getActionParams(attachments_query: object) {
		return typeof attachments_query === "object"
			? { attachments: attachments_query }
			: {};
	}
}
