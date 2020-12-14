export default function getAttachment(
	item: { [field: string]: string },
	field: string,
	response: { attachments: { [id: string]: any } }
) {
	return response.attachments[item[field] as string];
}
