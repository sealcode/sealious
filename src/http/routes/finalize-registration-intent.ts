import { Middleware } from "@koa/router";
import assert from "assert";

const finalizeRegistrationIntent: Middleware = async (ctx) => {
	assert(ctx.request.body.token, "Token missing");
	assert(ctx.request.body.username, "Username missing");
	assert(ctx.request.body.password, "Password missing");
	const intents = await ctx.$app.collections["registration-intents"]
		.suList()
		.filter({ token: ctx.request.body.token })
		.fetch();
	if (intents.empty) {
		throw new Error("Incorrect token");
	}

	const intent = intents.items[0];
	const user = await ctx.$app.collections.users.suCreate({
		password: ctx.request.body.password,
		username: ctx.request.body.username,
		email: intent.get("email"),
		roles: [],
	});
	if (intent.get("role")) {
		await ctx.$app.collections["user-roles"].suCreate({
			user: user.id,
			role: intent.get("role"),
		});
	}
	await intent.remove(new ctx.$app.SuperContext());
	const target_path = ctx.$app.ConfigManager.get(
		"accout_creation_success_path"
	);
	if (target_path) {
		assert.strictEqual(
			target_path[0],
			"/",
			"'accout_creation_success_path' set, but doesn't start with a '/'"
		);
		ctx.body = `<meta http-equiv="refresh" content="0; url=${target_path}" />`;
	}
	ctx.body = "Account creation successful";
	ctx.status = 201;
};

export default finalizeRegistrationIntent;
