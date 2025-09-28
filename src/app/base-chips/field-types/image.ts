import Field, {
	type ExtractFieldInput,
	type ValidationResult,
} from "../../../chip-types/field.js";
import { module_dirname } from "../../../utils/module_filename.js";
import FileField, { FileStorage } from "./file.js";

import _locreq from "locreq";
import type Context from "../../../context.js";
import type { PathFilePointer } from "@sealcode/file-manager";
const locreq = _locreq(module_dirname(import.meta.url));

/** Like {@link FileField}, but meant for images. Has the capacity to format images and serve thumbnails and different sizes.
 *
 * **Params**:
 * - `default_format` - string - one of the image formats defined in the app config. If not specified otherwise in the `format` parameter upon request, images will be served in the size corresponding to this format.
 */
export default class Image extends FileStorage {
	typeName = "image";
	default_format: string;

	async isProperValue(
		context: Context,
		input: ExtractFieldInput<FileField>
	): Promise<ValidationResult> {
		const result = await super.isProperValue(context, input);
		if (!result.valid) {
			return result;
		}
		if (Array.isArray(input)) {
			if (input.length !== 1) {
				throw new Error(
					"If you use array for this field, it can only have one file element"
				);
			}
			input = input[0];
		}
		if (!input.mimetype.startsWith("image/")) {
			return Field.invalid(context.i18n`Only image files are allowed.`);
		}
		return Field.valid();
	}

	setParams(
		params: Partial<
			Parameters<FileStorage["setParams"]>[0] & {
				default_format: string;
			}
		>
	): void {
		super.setParams({
			get_default_file: async () =>
				this.app.fileManager.fromPath(
					locreq.resolve(
						"src/app/base-chips/field-types/default-image.jpg"
					)
				),
			...params,
		});
		this.default_format = params.default_format || "url";
	}

	async decode(
		context: Context,
		db_value: string | null,
		_: unknown,
		format?: "file" | "url" | "path",
		is_http_api_request = false
	): Promise<PathFilePointer | string | null> {
		if (db_value === undefined || db_value === null) {
			return null;
		}
		if (format == undefined) {
			format = is_http_api_request ? "url" : "file";
		}
		if (format === "file") {
			return context.app.fileManager.fromToken(db_value);
		}
		if (format === "url") {
			const file = await context.app.fileManager.fromToken(db_value);
			return `${context.app.manifest.base_url}${file.getURL()}`;
		}
		if (format === "path") {
			const file = await context.app.fileManager.fromToken(db_value);
			return file.getURL();
		}
		return db_value;
	}
}
