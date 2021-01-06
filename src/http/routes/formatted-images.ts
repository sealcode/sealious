import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";

import { Middleware } from "@koa/router";
import { App, Errors, File } from "../../main";
import { FileFromDB } from "../../data-structures/file";

const QUALITY = 80;

type FormatObject = {
	size: number[];
};

function formatHash(format_obj: FormatObject) {
	return format_obj.size[0] + ":" + format_obj.size[1] + "(" + QUALITY + ")";
}

function formatFilename(
	original_filename: string,
	format_name: string
): string {
	return (
		path.basename(original_filename, path.extname(original_filename)) +
		"-" +
		format_name +
		".jpg"
	);
}

async function createFormattedVersion(
	app: App,
	file_id: string,
	format_name: string
): Promise<File> {
	const formats: { [format: string]: FormatObject } = app.ConfigManager.get(
		"image_formats"
	);
	const format_obj = formats[format_name];
	const original_file = await File.fromID(app, file_id);
	const file_path = original_file.getDataPath();
	const [width, height] = format_obj.size;

	const temp_file_name = formatFilename(original_file.filename, format_name);
	const temp_file_path = `/tmp/${temp_file_name}`;

	await sharp(file_path).resize(width, height).toFile(temp_file_path);

	const formatted_file = await File.fromPath(app, temp_file_path);
	await formatted_file.save();

	await app.collections["formatted-images"].suCreate({
		original_photo_file: original_file.id,
		formatted_photo_file: formatted_file.id,
		format: formatHash(format_obj),
	});

	await fs.unlink(temp_file_path);
	return formatted_file;
}

async function getFormattedVersion(
	app: App,
	format_obj: FormatObject,
	file_id: string
): Promise<File | null> {
	const hash = formatHash(format_obj);
	const results = await app.collections["formatted-images"]
		.suList()
		.filter({ original_photo_file: file_id, format: hash })
		.fetch();
	if (results.items.length === 0) {
		return null;
	}
	return File.fromID(app, results.items[0].get("formatted_photo_file"));
}

const formattedImages: Middleware = async (ctx) => {
	const format_name = ctx.params.format;

	const image_formats: { [format: string]: any } = ctx.$app.ConfigManager.get(
		"image_formats"
	);
	const format_obj =
		image_formats[format_name as keyof typeof image_formats] || null;

	if (!format_obj) {
		throw new Errors.BadSubjectPath("Unknown image format: " + format_name);
	}

	let formatted_version: File | FileFromDB =
		(await getFormattedVersion(ctx.$app, format_obj, ctx.params.file_id)) ||
		(await createFormattedVersion(
			ctx.$app,
			ctx.params.file_id,
			ctx.params.format
		));

	ctx.body = formatted_version.getStream();
};

export default formattedImages;
