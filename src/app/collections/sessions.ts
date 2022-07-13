import Router from "@koa/router";
import Collection from "../../chip-types/collection";
import type { ItemFields } from "../../chip-types/collection-item-body";
import { Errors, FieldTypes, Policies } from "../../main";
import SecureHasher from "../../utils/secure-hasher";

export default class Sessions extends Collection {
	name = "sessions";
	fields = {
		"session-id": new FieldTypes.SessionID(),
		user: new FieldTypes.SingleReference("users"),
	};

	policies = {
		list: new Policies.UserReferencedInField("user"),
	};
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

	//returns a session ID to put in the cookie or throws an error if something went wrong
	async login(username: string, password: string): Promise<string> {
		if (!username) {
			throw new Errors.InvalidCredentials("Missing username!");
		}
		if (!password) {
			throw new Errors.InvalidCredentials("Missing password!");
		}

		const [user] = await this.app.Datastore.find("users", {
			"username.safe": username,
		});

		if (!user) {
			throw new Errors.InvalidCredentials("Incorrect username!");
		}

		const is_valid = await SecureHasher.matches(
			password,
			user.password as string
		);
		if (!is_valid) {
			throw new Errors.InvalidCredentials("Incorrect password!");
		}
		const session = this.make({
			user: user.id,
			"session-id": null,
		} as ItemFields<this>);
		await session.save(new this.app.SuperContext());
		const session_id = session.get("session-id");
		return session_id as string;
	}
}
