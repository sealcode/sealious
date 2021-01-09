import { Middleware } from "@koa/router";
import { promises as fs } from "fs";
import koaBody from "koa-body";
import File from "../data-structures/file";

export default function parseBody(): Middleware {
	const koaParser = koaBody({ multipart: true });
	return async (ctx, next) => {
		await koaParser(ctx, () => Promise.resolve());
		if (!ctx.request.body) {
			ctx.request.body = {};
		}
		const promises: Promise<void>[] = [];
		if (ctx.request.files) {
			for (const file_name in ctx.request.files) {
				const file = ctx.request.files[file_name];
				if (file.type === "application/json" && file.name === "blob") {
					promises.push(
						fs.readFile(file.path, "utf-8").then((string) => {
							ctx.request.body[file_name] = JSON.parse(string);
						})
					);
				} else {
					promises.push(
						File.fromPath(ctx.$app, file.path, file.name).then(
							(sealious_file) => {
								ctx.request.body[file_name] = sealious_file;
							}
						)
					);
				}
			}
		}

		await Promise.all(promises);
		ctx.$app.Logger.info("REQUEST", "Parsed body", ctx.request.body);
		ctx.$body = ctx.request.body;
		await next();
	};
}
