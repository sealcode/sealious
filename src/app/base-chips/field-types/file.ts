import { Field, Context, File } from "../../../main";
import type { FileDBEntry } from "../../../data-structures/file";
import {
	hasField,
	hasFieldOfType,
	is,
	predicates,
} from "@sealcode/ts-predicates";

export type FileStorageFormat = FileDBEntry;

export abstract class FileStorage extends Field {
	handles_large_data = true;
	get_default_file: (context: Context) => Promise<File>;
	async isProperValue(context: Context, value: File | [File]) {
		if (typeof value === "string") {
			return Field.valid();
		}
		if (Array.isArray(value)) {
			if (value.length !== 1) {
				throw new Error(
					"If you use array for this field, it can only have one file element"
				);
			}
			value = value[0] as File;
		}
		if (value === null || value instanceof File) {
			return Field.valid();
		}

		if (
			is(value, predicates.object) &&
			hasFieldOfType(value, "id", predicates.string) &&
			hasFieldOfType(value, "filename", predicates.string) &&
			hasField("data", value)
		) {
			return Field.valid();
		}

		return Field.invalid(context.app.i18n("invalid_file_storage"));
	}

	setParams(params: {
		get_default_file: (context: Context) => Promise<File>;
	}) {
		this.get_default_file = params.get_default_file;
	}

	async encode(_: Context, file: File | [File]) {
		if (file === null) {
			return null;
		}
		if (Array.isArray(file)) {
			if (file.length !== 1) {
				throw new Error(
					"If you use array for this field, it can only have one file element"
				);
			}
			file = file[0] as File;
		}
		if (!file.id) {
			await file.save();
		}
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
	async decode(
		_: Context,
		db_value: FileStorageFormat | null,
		__: any,
		format?: "url" | "file"
	) {
		if (db_value === null) {
			return null;
		}
		const file = await File.fromID(this.app, db_value.id);
		if (format == undefined) {
			return { id: file.id, filename: file.filename };
		} else if (format == "file") {
			return file;
		} else {
			return file.getURL();
		}
	}
}
