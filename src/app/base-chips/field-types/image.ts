import { is, predicates } from "@sealcode/ts-predicates";
import locreq_curry from "locreq";
const locreq = locreq_curry(__dirname);
import Field from "../../../chip-types/field";
import { Context, ExtractInput, File } from "../../../main";
import FileField, { FileStorage, FileStorageFormat } from "./file";

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
		if (Array.isArray(input)) {
			if (input.length !== 1) {
				throw new Error(
					"If you use array for this field, it can only have one file element"
				);
			}
			input = input[0] as File;
		}
		if (input.getMimeType().indexOf("image/") !== 0) {
			return Field.invalid(context.app.i18n("invalid_image"));
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
		db_value: FileStorageFormat | null,
		_: unknown,
		format: unknown
	) {
		if (db_value === undefined || db_value === null) {
			return null;
		}
		if (format === "file") {
			return File.fromID(context.app, db_value.id);
		}
		return db_value;
	}
}
