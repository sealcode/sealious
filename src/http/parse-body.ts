import type { Middleware } from "@koa/router";
import { promises as fs } from "fs";
import koaBody from "koa-body";
import File from "../data-structures/file";
import { ValidationError } from "../response/errors";
import dotProp from "dot-prop";

function setDeep(
	target: Record<string, unknown>,
	complex_key: string,
	value: unknown
) {
	dotProp.set(
		target,
		complex_key.replaceAll("[", ".").replaceAll("]", ""),
		value
	);
}

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
								.then((json_str) =>
									setDeep(
										ctx.request.body,
										file_name,
										JSON.parse(json_str)
									)
								)
						);
						continue;
					} else {
						files = [files];
					}
				}
				const file_promises = files.map(async (file) => {
					const extracted_filename = file.name;
					if (extracted_filename) {
						return File.fromPath(
							ctx.$app,
							file.path,
							extracted_filename
						);
					}
				});
				promises.push(
					Promise.all(file_promises).then((sealious_files) => {
						setDeep(ctx.request.body, file_name, sealious_files);
					})
				);
			}
		}

		for (const [key, value] of Object.entries(original_body)) {
			setDeep(ctx.request.body, key, value);
		}

		for (const [key, value] of Object.entries(ctx.query)) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			if (ctx.request.body[key] === undefined) {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				setDeep(ctx.request.body, key, value);
			}
		}

		await Promise.all(promises);
		ctx.$app.Logger.info("REQUEST", "Parsed body", ctx.request.body);
		ctx.$body = ctx.request.body;
		await next();
	};
}
