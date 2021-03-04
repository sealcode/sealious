import { Field, Context, File } from "../../../main";
import { FileDBEntry } from "../../../data-structures/file";

type FileOutput = string | File;
type FileFormat = "internal" | "url";

export type FileStorageFormat = FileDBEntry;

export abstract class FileStorage extends Field {
	handles_large_data = true;
	get_default_file: (context: Context) => Promise<File>;
	async isProperValue(context: Context, value: File) {
		if (typeof value === "string") {
			return Field.valid();
		}
		if (value === null || value instanceof File) {
			return Field.valid();
		}

		return Field.invalid(context.app.i18n("invalid_file_storage"));
	}

	setParams(params: {
		get_default_file: (context: Context) => Promise<File>;
	}) {
		this.get_default_file = params.get_default_file;
	}

	async encode(_: Context, file: File) {
		if (file === null) {
			return null;
		}
		await file.save();
		return file.toDBEntry();
	}
}

/** Takes a {@File} instance as input, stores it in the FS and then decodes to a URL.
 *
 * **Params**:
 * - `get_default_file` - ()=>Promise<{@link File}> - if no file is provided, then this file will be used in it's stead
 */
export default class FileField extends FileStorage {
	typeName = "file";
	async decode(_: Context, db_value: FileStorageFormat | null, __: any) {
		if (db_value === null) {
			return null;
		}
		const file = await File.fromID(this.app, db_value.id);
		return file.getURL();
	}
}
