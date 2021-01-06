import { Middleware } from "@koa/router";
import assert from "assert";
import { BadContext } from "../../response/errors";

const finalizePasswordReset: Middleware = async (ctx) => {
	assert(ctx.request.body.token, "Token missing");
	assert(ctx.request.body.password, "Password missing");

	if (typeof ctx.request.body.token !== "string") {
		throw new Error("Invalid token");
	}

	if (typeof ctx.request.body.password !== "string") {
		throw new Error("Invalid password");
	}

	const intent_response = await ctx.$app.collections["password-reset-intents"]
		.suList()
		.filter({ token: ctx.request.body.token })
		.fetch();

	if (intent_response.empty) {
		throw new BadContext("Incorrect token");
	}

	const intent = intent_response.items[0];

	const user_response = await ctx.$app.collections.users
		.suList()
		.filter({ email: intent.get("email") as string })
		.fetch();
	if (user_response.empty) {
		throw new Error("No user with this email address.");
	}
	user_response.items[0].set("password", ctx.request.body.password);
	await user_response.items[0].save(new ctx.$app.SuperContext());
	await intent.remove(new ctx.$app.SuperContext());
	ctx.body = "Password reset successful";
};

export default finalizePasswordReset;
