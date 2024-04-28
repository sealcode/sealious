import type { Middleware } from "@koa/router";
import { promises as fs } from "fs";
import koaBody from "koa-body";
import qs from "qs";

export default function parseBody(): Middleware {
	const koaParser = koaBody({ multipart: true });
	return async (ctx, next) => {
		await koaParser(ctx, () => Promise.resolve());
		const original_body = ctx.request.body || {};
		ctx.request.body = {};
		const promises: Promise<void>[] = [];
		if (ctx.request.files) {
			for (const file_name in ctx.request.files) {
				let files = ctx.request.files[file_name];

				if (!Array.isArray(files)) {
					if (
						files.type === "application/json" &&
						files.name === "blob"
					) {
						promises.push(
							fs
								.readFile(files.path, "utf-8")
								.then((json_str) => {
									ctx.request.body[file_name] =
										JSON.parse(json_str);
								})
						);
						continue;
					} else {
						files = [files];
					}
				}
				const file_promises = files.map(async (file) => {
					const extracted_filename = file.name;
					if (extracted_filename) {
						return ctx.$app.FileManager.fromPath(
							file.path,
							extracted_filename
						);
					}
				});
				promises.push(
					Promise.all(file_promises).then((sealious_files) => {
						ctx.request.body[file_name] = sealious_files;
					})
				);
			}
		}

		for (const [key, value] of Object.entries(original_body)) {
			ctx.request.body[key] = value;
		}

		for (const [key, value] of Object.entries(ctx.query)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (ctx.request.body[key] === undefined) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				ctx.request.body[key] = value;
			}
		}

		for (const [key, value] of Object.entries(ctx.request.body)) {
			// resolve all file tokens into actual files
			if (
				typeof value == "string" &&
				ctx.$app.FileManager.couldBeAFileToken(value)
			) {
				let file;
				try {
					file = await ctx.$app.FileManager.fromToken(value);
				} catch (e) {
					// not a file
				}
				ctx.request.body[key] = file;
			}
		}

		await Promise.all(promises);
		ctx.$body = qs.parse(ctx.request.body, {
			allowDots: true,
			depth: 20,
			allowEmptyArrays: true,
		});
		ctx.$app.Logger.info("REQUEST", "Parsed body", ctx.$body);
		ctx.request.body = ctx.$body;
		await next();
	};
}
