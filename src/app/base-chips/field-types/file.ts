import {
	BufferFilePointer,
	FilePointer,
	PathFilePointer,
} from "@sealcode/file-manager";
import Field from "../../../chip-types/field.js";
import type Context from "../../../context.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

export abstract class FileStorage extends Field<
	FilePointer | string,
	FilePointer | [FilePointer],
	string
> {
	handles_large_data = true;

	open_api_type: OpenApiTypes = OpenApiTypes.URI_REF;

	get_default_file: (context: Context) => Promise<FilePointer>;
	async isProperValue(context: Context, value: FilePointer | [FilePointer]) {
		if (typeof value === "string") {
			return Field.valid();
		}
		if (Array.isArray(value)) {
			if (value.length !== 1) {
				throw new Error(
					"If you use array for this field, it can only have one file element"
				);
			}
			value = value[0];
		}
		if (value === null || value instanceof File) {
			return Field.valid();
		}

		if (value instanceof FilePointer) {
			return Field.valid();
		}

		return Field.invalid(
			context.i18n`This value should be a file upload or an instance of the File object.`
		);
	}

	setParams(params: {
		get_default_file: (context: Context) => Promise<FilePointer>;
	}) {
		this.get_default_file = params.get_default_file;
	}

	async encode(_: Context, file: FilePointer | [FilePointer]) {
		if (file === null) {
			return null;
		}
		if (Array.isArray(file)) {
			if (file.length !== 1) {
				throw new Error(
					"If you use array for this field, it can only have one file element"
				);
			}
			file = file[0];
		}
		let token;
		if (
			(file instanceof PathFilePointer && !file.has_id) ||
			file instanceof BufferFilePointer
		) {
			token = await file.save(true);
		}
		return token || file.token;
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" VARCHAR`];
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
		context: Context,
		db_value: string | null,
		__: any,
		format?: "url" | "file",
		is_http_api_request = false
	) {
		if (db_value === null || db_value == undefined) {
			return null;
		}
		const file = await context.app.fileManager.fromToken(db_value);
		if (format == undefined) {
			format = is_http_api_request ? "url" : "file";
		}
		if (format == "file") {
			return file;
		} else {
			return file.getURL();
		}
	}
}
