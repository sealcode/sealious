import type { Middleware } from "@koa/router";
import type { FileManager } from "@sealcode/file-manager";
import { promises as fs } from "fs";
import koaBody from "koa-body";
import qs from "qs";

export default function parseBody(file_manager?: FileManager): Middleware {
	const koaParser = koaBody({ multipart: true });
	return async (ctx, next) => {
		if (!file_manager) {
			// we use it as an argument to be able to use this middleware sometimes without a Sealious App
			file_manager = ctx.$app.FileManager;
		}
		if (!file_manager) {
			throw new Error("Missing file manager");
		}
		const final_file_manager = file_manager;
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
						return final_file_manager.fromPath(
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
				final_file_manager.couldBeAFileToken(value)
			) {
				let file;
				try {
					file = await final_file_manager.fromToken(value);
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
