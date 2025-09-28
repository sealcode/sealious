/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type * as Koa from "koa";
import type { Middleware } from "@koa/router";
import Context from "../context.js";

export default function extract_context(): Middleware {
	return async function (ctx, next) {
		const config = ctx.$app.ConfigManager.get("www-server");
		const cookie_name = config["session-cookie-name"];
		let session_id: string | undefined = ctx.cookies.get(cookie_name);
		const timestamp = Date.now();
		if (ctx.$context) {
			await next();
			return;
		}

		if (!ctx.$cache) {
			const cache_entries: Record<
				string,
				unknown | Promise<unknown> | undefined
			> = {};

			ctx.$cache = async function <T>(
				key: string,
				getter: (ctx: Koa.Context) => Promise<T>
			) {
				if (cache_entries[key] == undefined) {
					cache_entries[key] = getter(ctx);
				}
				return cache_entries[key] as Promise<T> | T;
			};
		}

		if (!session_id) {
			ctx.$context = new Context({ app: ctx.$app, timestamp });
		} else {
			const sessions = await ctx.$app.collections.sessions
				.suList()
				.filter({ "session-id": session_id })
				.fetch();

			let user_id;
			if (sessions.empty) {
				session_id = undefined;
			} else {
				user_id = sessions.items[0]!.get("user") as string;
			}
			ctx.$app.Logger.debug(
				"EXTRACT CONTEXT",
				"User for this request is",
				user_id
			);
			ctx.$context = new Context({
				app: ctx.$app,
				timestamp,
				user_id,
				session_id,
			});
		}
		await next();
	};
}
