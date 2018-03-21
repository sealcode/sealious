"use strict";
module.exports = {
	name: "users",
	fields: [
		{
			name: "username",
			type: "username",
			required: true,
		},
		{
			name: "email",
			type: "email",
			required: true,
		},
		{
			name: "password",
			type: "hashed-text",
			params: {
				min_length: 6,
				hide_hash: true,
			},
			required: true,
		},
		{
			name: "status",
			type: "text",
		},
		{
			name: "last_login_context",
			type: "context",
		},
	],
	access_strategy: {
		default: "public",
		retrieve: "themselves",
	},
};
