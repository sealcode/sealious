import Boom from "boom";
import type SealiousError from "../response/errors.js";

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

export default function error_to_boom(error: SealiousError) {
	const code = error_code_map[error.type as keyof typeof error_code_map];
	const ret = new Boom(error.message, { statusCode: code });
	// @ts-ignore;
	ret.output.payload.type = error.type;
	// @ts-ignore;
	ret.output.payload.data = error.data;
	return ret;
}
