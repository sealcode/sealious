import Router from "@koa/router";
import parseBody from "../parse-body.js";

const sessionRouter = new Router();

sessionRouter.post("/", parseBody(), async (ctx) => {
	const username = ctx.request.body.username;
	const password = ctx.request.body.password;
	const session_id = await ctx.$app.collections.sessions.login(
		username,
		password
	);
	ctx.body = { status: "logged in!" };
	ctx.status = 201;
	const config = ctx.$app.ConfigManager.get("www-server");
	const cookie_name = config["session-cookie-name"];
	ctx.cookies.set(cookie_name, session_id, {
		maxAge: 1000 * 60 * 60 * 24 * 7,
		secure: ctx.request.protocol === "https",
		overwrite: true,
	});
});

export default sessionRouter;
