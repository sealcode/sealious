import { Item } from "../main";

export type LooseObject = {
	[key: string]: any;
};

export type AttachmentParams = {
	attachments: LooseObject;
};

export type AssignAttachmentsResult = {
	attachments: LooseObject;
	fieldsWithAttachments: LooseObject;
	items?: Array<Item>;
};
