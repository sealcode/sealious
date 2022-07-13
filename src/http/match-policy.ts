import type { Middleware } from "@koa/router";
import type Policy from "../chip-types/policy";

export default function MatchPolicy(policy: Policy): Middleware {
	return async function (ctx, next) {
		const result = await policy.check(ctx.$context);
		if (!result) {
			ctx.body = "Not allowed";
			ctx.status = 403;
			return;
		}
		if (!result.allowed) {
			ctx.body = result.reason;
			ctx.status = 403;
		}
		if (result.allowed) await next();
	};
}
