"use strict";
const Sealious = require("../../lib/main");
const Boom = require("boom");

const error_code_map = {
	validation: 403,
	value_exists: 409,
	invalid_credentials: 401,
	not_found: 404,
	permission: 401,
	bad_subject: 404,
	bad_subject_action: 405,
	field_does_not_support_attachments: 405,
};

function error_to_boom(error) {
	const code = error_code_map[error.type];
	const ret = Boom.create(code, error.message, error);
	ret.output.payload = error;
	return ret;
}

module.exports = error_to_boom;
