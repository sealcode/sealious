import Router from "@koa/router";
import type Policy from "../../chip-types/policy";
import {
	Collection,
	FieldTypes,
	Policies,
	Context,
	ActionName,
} from "../../main";
import { BadContext } from "../../response/errors";
import SecureHasher from "../../utils/secure-hasher";

export default class Users extends Collection {
	fields = {
		username: new FieldTypes.Username(),
		password: new FieldTypes.Password(),
	};

	defaultPolicy: Policy = new Policies.Themselves();

	policies = {
		create: new Policies.Super(),
		show: new Policies.Themselves(),
	} as Partial<{ [a in ActionName]: Policy }>;

	getRouter() {
		const router = new Router();
		router.get("/me", async (ctx) => {
			if (typeof ctx.$context.user_id !== "string") {
				throw new BadContext("You're not logged in!");
			}
			const user = this.list(ctx.$context)
				.ids([ctx.$context.user_id])
				.setParams(ctx.query);
			ctx.body = (await user.fetch()).serialize() as Record<
				string,
				unknown
			>;
		});

		const super_router = super.getRouter();

		router.use(super_router.routes(), super_router.allowedMethods());

		return router;
	}

	static async passwordMatches(
		context: Context,
		username: string,
		password: string
	) {
		const [user] = await context.app.Datastore.find("users", {
			"username.safe": username,
		});
		if (!user || !user.password) {
			return false;
		}
		return await SecureHasher.matches(password, user.password as string);
	}
}
