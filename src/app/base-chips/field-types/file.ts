import { Field, Context, File } from "../../../main";
import { FileDBEntry } from "../../../data-structures/file";

type FileOutput = string | File;
type FileFormat = "internal" | "url";

export type FileStorageFormat = FileDBEntry;

export abstract class FileStorage<Output = any, Format = any> extends Field<
	File,
	Output,
	Format
> {
	handles_large_data = true;
	get_default_file: (context: Context) => Promise<File>;
	async isProperValue(_: Context, value: File) {
		if (typeof value === "string") {
			return Field.valid();
		}
		if (value === null || value instanceof File) {
			return Field.valid();
		}

		return Field.invalid(
			"This value should e a file upload or an instance of the File object"
		);
	}

	setParams(params: {
		get_default_file: (context: Context) => Promise<File>;
	}) {
		this.get_default_file = params.get_default_file;
	}

	async encode(_: Context, file: File) {
		await file.save();
		return file.toDBEntry();
	}
}

export default class FileField extends FileStorage<FileOutput, FileFormat> {
	getTypeName = () => "file";
	async decode(
		_: Context,
		db_value: FileStorageFormat,
		__: any,
		format?: FileFormat
	) {
		const file = await File.fromID(this.app, db_value.id);
		if (format === "url") {
			return file.getURL();
		}
		return file;
	}
}
