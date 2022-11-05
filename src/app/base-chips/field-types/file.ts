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
		if (is(value, predicates.array(predicates.instanceOf(File)))) {
			value = value[0];
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
		if (is(file, predicates.array(predicates.instanceOf(File)))) {
			file = file[0];
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
	async decode(_: Context, db_value: FileStorageFormat | null, __: any) {
		if (db_value === null) {
			return null;
		}
		const file = await File.fromID(this.app, db_value.id);
		return file.getURL();
	}
}
