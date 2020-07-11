import sharp from "sharp";
import path from "path";
import { promises as fs } from "fs";
import { NoActionSubject, LeafSubject } from "../../subject";
import * as Errors from "../../../response/errors";
import App from "../../../app/app";
import Context from "../../../context";
import { ShowActionName } from "../../../action";
import File from "../../../data-structures/file";
import { CollectionResponse } from "../../../../common_lib/response/responses";

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

class ImageFormatFile extends LeafSubject {
	file_id: string;
	file_name: string;
	format_name: string;

	constructor(
		app: App,
		file_id: string,
		file_name: string,
		format_name: string
	) {
		super(app);
		this.file_id = file_id;
		this.file_name = file_name;
		this.format_name = format_name;
	}

	getFormat() {
		const image_formats = this.app.ConfigManager.get("image_formats");
		return (
			image_formats[this.format_name as keyof typeof image_formats] ||
			null
		);
	}

	async performAction(_: Context, action_name: ShowActionName, __: any) {
		if (action_name !== "show") {
			throw new Errors.DeveloperError(
				`Unknown action for '${this.getName()}' subject: '${action_name}'`
			);
		}

		const format_obj = this.getFormat();

		if (!format_obj) {
			throw new Errors.BadSubjectPath(
				"Unknown image format: " + this.format_name
			);
		}

		let formattedVersion = await this.getFormattedVersion(format_obj);

		if (!formattedVersion) {
			formattedVersion = await this.createFormattedVersion(
				this.file_id,
				this.format_name
			);
		}
		return formattedVersion;
	}

	async getFormattedVersion(format_obj: FormatObject): Promise<File | null> {
		const hash = formatHash(format_obj);
		const results = (await this.app.runAction(
			new this.app.SuperContext(),
			["collections", "formatted-images"],
			"show",
			{
				original_photo_file: { $eq: this.file_id },
				format: hash,
			}
		)) as CollectionResponse;
		if (results.items.length === 0) {
			return null;
		}
		return File.fromID(this.app, results.items[0].formatted_photo_file);
	}

	getFormatData(format_name: string) {
		const formats = this.app.ConfigManager.get("image_formats");
		return formats[format_name as keyof typeof formats];
	}

	async createFormattedVersion(
		file_id: string,
		format_name: string
	): Promise<File> {
		const format_obj: FormatObject = this.getFormatData(format_name);

		const original_file = await File.fromID(this.app, file_id);
		const file_path = original_file.getDataPath();
		const [width, height] = format_obj.size;

		const temp_file_name = formatFilename(
			original_file.filename,
			format_name
		);
		const temp_file_path = `/tmp/${temp_file_name}`;

		await sharp(file_path).resize(width, height).toFile(temp_file_path);

		const formatted_file = await File.fromPath(this.app, temp_file_path);
		await formatted_file.save();

		await this.app.runAction(
			new this.app.SuperContext(),
			["collections", "formatted-images"],
			"create",
			{
				original_photo_file: original_file.id,
				formatted_photo_file: formatted_file.id,
				format: formatHash(format_obj),
			}
		);

		await fs.unlink(temp_file_path);
		return formatted_file;
	}

	getName() {
		return "SingleFile";
	}
}

export class ImageFormat extends NoActionSubject {
	file_id: string;
	format_name: string;

	constructor(app: App, file_id: string, format_name: string) {
		super(app);
		this.file_id = file_id;
		this.format_name = format_name;
	}

	async getChildSubject(path_element: string) {
		const file_name = path_element;
		return new ImageFormatFile(
			this.app,
			this.file_id,
			file_name,
			this.format_name
		);
	}

	getName() {
		return "ImageFormats";
	}
}
