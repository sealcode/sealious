import type { Middleware } from "@koa/router";

import Generator from "../../schemas/generator.js";

const openApiSchema: Middleware = async (ctx) => {
	const data = await new Generator(ctx.$app).generateSchema();
	ctx.set("Content-Type", "application/json");
	ctx.body = data;
};

export default openApiSchema;
