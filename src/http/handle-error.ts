import SealiousError from "../response/errors";
import type { Middleware } from "@koa/router";

const error_code_map: { [type: string]: number } = {
	validation: 403,
	value_exists: 409,
	invalid_credentials: 401,
	not_found: 404,
	permission: 401,
	bad_subject: 404,
	bad_subject_action: 405,
	field_does_not_support_attachments: 405,
};

export default function handleError(): Middleware {
	return async function (ctx, next) {
		try {
			await next();
		} catch (error) {
			ctx.$app.Logger.error("HTTP ERR", "Responding with error", error);
			if (error instanceof SealiousError && error.is_user_fault) {
				ctx.status = error_code_map[error.type] || 500;
				ctx.body = error.toObject();
			} else {
				ctx.status = 500;
				ctx.body = { message: "Server error" };
				console.error(error);
			}
		}
	};
}
