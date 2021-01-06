import locreq_curry from "locreq";
const locreq = locreq_curry(__dirname);
import Field from "../../../chip-types/field";
import { Context, ExtractInput, File } from "../../../main";
import FileField, { FileStorage, FileStorageFormat } from "./file";

type ImageFormat = "internal" | "original" | string;

/** Like {@link FileField}, but meant for images. Has the capacity to format images and serve thumbnails and different sizes.
 *
 * **Params**:
 * - `default_format` - string - one of the image formats defined in the app config. If not specified otherwise in the `format` parameter upon request, images will be served in the size corresponding to this format.
 */
export default class Image extends FileStorage {
	typeName = "image";
	default_format: string;

	async isProperValue(context: Context, input: ExtractInput<FileField>) {
		const result = await super.isProperValue(context, input);
		if (!result.valid) {
			return result;
		}
		if (input.getMimeType().indexOf("image/") !== 0) {
			return Field.invalid("Only image files are allowed");
		}
		return Field.valid();
	}

	setParams(
		params: Partial<
			Parameters<FileStorage["setParams"]>[0] & {
				default_format: string;
			}
		>
	) {
		super.setParams({
			get_default_file: () =>
				File.fromPath(
					this.app,
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
		db_value: FileStorageFormat,
		__: any,
		format?: ImageFormat
	) {
		context.app.Logger.debug3(
			"FIELD",
			"Decoding image field with format",
			format
		);
		if (db_value === undefined || db_value === null) {
			return null;
		}
		if (format === "internal") return db_value;

		if (format === undefined) format = this.default_format || "original";

		if (format === "original") {
			const file = await File.fromID(this.app, db_value.id);
			return file.getURL();
		} else {
			return (
				`/api/v1/formatted-images/${db_value.id}/` +
				`${format}/${db_value.filename}`
			);
		}
	}
}
