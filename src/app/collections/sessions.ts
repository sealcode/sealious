import Router from "@koa/router";
import Collection from "../../chip-types/collection.js";
import { Context, Errors, FieldTypes, Policies } from "../../main.js";
import SecureHasher from "../../utils/secure-hasher.js";

export default class Sessions extends Collection {
	name = "sessions";
	fields = {
		"session-id": new FieldTypes.SessionID(),
		user: new FieldTypes.SingleReference("users"),
	};

	policies = {
		list: new Policies.UserReferencedInField("user"),
		delete: new Policies.UserReferencedInField("user"),
	};
	defaultPolicy = new Policies.Super();

	internal = true;

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
		const session = (this as Sessions).make({
			user: user.id as unknown as string,
			"session-id": undefined,
		});
		await session.save(new this.app.SuperContext());
		const session_id = session.get("session-id");
		return session_id as string;
	}

	async logout(context: Context, session_id: string): Promise<void> {
		const {
			items: [session],
		} = await this.app.collections.sessions
			.list(context)
			.filter({ "session-id": session_id })
			.fetch();
		if (!session) {
			throw new Error(
				"Logout error: Wrong session ID or you don't have access to that session"
			);
		}
		try {
			await session.delete(context);
		} catch (e) {
			console.error(e);
			throw new Error(
				"Logout: Could not delete the session. Do you have the right permisions?"
			);
		}
	}
}
