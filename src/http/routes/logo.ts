import { Middleware } from "@koa/router";
import { basename, dirname } from "path";
import send from "koa-send";

const logo: Middleware = async (ctx) => {
	await send(ctx, basename(ctx.$app.manifest.logo), {
		root: dirname(ctx.$app.manifest.logo),
	});
};

export default logo;
