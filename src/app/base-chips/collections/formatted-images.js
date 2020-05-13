"use strict";
module.exports = {
	name: "formatted-images",
	fields: [
		{
			name: "original_photo_file",
			type: "file_reference",
			params: { collection: "files" },
			required: true,
		},
		{
			name: "formatted_photo_file",
			type: "file_reference",
			params: { collection: "files" },
			required: true,
		},
		{ name: "format", type: "text", required: "true" },
	],
	access_strategy: {
		default: "super",
	},
};
