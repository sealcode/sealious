import Router from "@koa/router";
import { Collection, Errors, FieldTypes, Policies } from "../../main";

export default class Sessions extends Collection {
	name = "sessions";
	fields = {
		"session-id": new FieldTypes.SessionID(),
		user: new FieldTypes.SingleReference("users"),
	};

	policies = {};
	defaultPolicy = new Policies.Super();

	getRouter() {
		const router = new Router();

		router.delete("/current", async (ctx) => {
			try {
				const sessions = await ctx.$app.collections.sessions
					.suList()
					.filter({ "session-id": ctx.$context.session_id })
					.fetch();
				await Promise.all(
					sessions.items.map(async (session) =>
						session.remove(new this.app.SuperContext())
					)
				);
				ctx.body = "You've been logged out";
			} catch (e) {
				return Promise.reject(
					new Errors.BadContext("Invalid session id!")
				);
			}
		});

		const super_router = super.getRouter();
		router.use(super_router.routes(), super_router.allowedMethods());
		return router;
	}
}
