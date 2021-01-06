import { Middleware } from "@koa/router";
import App from "../app/app";
import Context from "../context";

export default function extract_context(): Middleware {
	return async function (ctx, next) {
		const config = ctx.$app.ConfigManager.get("www-server");
		const cookie_name = config["session-cookie-name"];
		let session_id: string | undefined = ctx.cookies.get(cookie_name);
		const timestamp = Date.now();

		if (!session_id) {
			ctx.$context = new Context(ctx.$app, timestamp, null, null);
		} else {
			const sessions = await ctx.$app.collections.sessions
				.suList()
				.filter({ "session-id": session_id })
				.fetch();

			let user_id;
			if (sessions.empty) {
				session_id = undefined;
			} else {
				user_id = sessions.items[0].get("user") as string;
			}
			ctx.$app.Logger.debug(
				"EXTRACT CONTEXT",
				"User for this request is",
				user_id
			);
			ctx.$context = new Context(
				ctx.$app,
				timestamp,
				user_id,
				session_id
			);
		}
		await next();
	};
}

module.exports = extract_context;
