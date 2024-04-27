import mime from "mime-types";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { tmpdir } from "node:os";
import path, { basename } from "node:path";
import { v4 as uuidv4 } from "uuid";
import { UPLOADED_FILES_BASE_URL } from "../app/consts.js";

export abstract class FilePointer {
	public type: string;
	public token: string | null;
	abstract getPath(): Promise<string>;
	abstract getContent(): Promise<Buffer>;
	abstract save(persistent: boolean): Promise<string>;

	constructor(public file_manager: FileManager, public mimetype: string) {}
}

export class PathFilePointer extends FilePointer {
	type = <const>"path";
	constructor(
		file_manager: FileManager,
		public file_path: string,
		filename = basename(file_path),
		public has_id = false,
		public token: string | null = null
	) {
		super(
			file_manager,
			mime.lookup(path.extname(filename).slice(1)) ||
				"application/octet-stream"
		);
	}

	getContent() {
		return fs.readFile(this.file_path);
	}

	async save(persistent: boolean): Promise<string> {
		this.token = await this.file_manager.addFile(
			await fs.readFile(this.file_path),
			this.mimetype,
			persistent
		);
		this.has_id = true;
		const { name: filename } = this.file_manager.parseToken(this.token);
		this.file_path = await this.file_manager.resolveFilePath(
			filename,
			persistent
		);
		return this.token;
	}

	async getPath() {
		return this.file_path;
	}

	getURL() {
		return (
			UPLOADED_FILES_BASE_URL +
			"/" +
			"persistent/" +
			path.basename(this.file_path)
		);
	}

	getStream() {
		return createReadStream(this.file_path);
	}
}

export class BufferFilePointer extends FilePointer {
	type = <const>"buffer";
	constructor(
		file_manager: FileManager,
		public content: Buffer,
		public filename_extension: string
	) {
		super(
			file_manager,
			mime.lookup(filename_extension) || "application/octet-stream"
		);
	}

	async getContent() {
		return this.content;
	}

	async save(persistent: boolean): Promise<string> {
		this.token = await this.file_manager.addFile(
			this.content,
			this.filename_extension,
			persistent
		);
		return this.token;
	}

	async getPath(): Promise<never> {
		throw new Error(
			"This file does not have a path on the filesystem yet. To get a handle to that file for future reference, use the value returned by `toToken`"
		);
	}
}

export class FileManager {
	public tmpdir: string;

	constructor(public persistent_dir_path: string) {
		this.tmpdir = tmpdir();
	}

	private getStorageDir(persistent: boolean) {
		return persistent ? this.persistent_dir_path : this.tmpdir;
	}

	async addFile(
		content: Buffer,
		mimetype: string,
		persistent: boolean
	): Promise<string> {
		const target_filename =
			uuidv4() + "." + (mime.extension(mimetype) || "data");
		await fs.writeFile(
			await this.resolveFilePath(target_filename, persistent),
			content
		);
		return this.encodeToken(persistent, target_filename);
	}

	async resolveFilePath(
		filename: string,
		persistent: boolean
	): Promise<string> {
		return path.resolve(this.getStorageDir(persistent), filename);
	}

	parseToken(token: string): { persistent: boolean; name: string } {
		return JSON.parse(token);
	}

	encodeToken(persistent: boolean, name: string) {
		return JSON.stringify({ persistent, name });
	}

	async fromToken(token: string): Promise<PathFilePointer> {
		const { persistent, name } = this.parseToken(token);
		if (name.includes(path.sep)) {
			throw new Error(
				"filenames cannot contain directory paths, for security reasons"
			);
		}
		return new PathFilePointer(
			this,
			path.resolve(this.getStorageDir(persistent), name),
			path.extname(name),
			true,
			token
		);
	}

	fromPath(path: string, file_name = basename(path)) {
		// sometimes the file is stored in a temp dir immediately after upload and its original intended filename is stored elsewhere
		return new PathFilePointer(this, path, file_name);
	}

	fromContent(content: Buffer, extension: string) {
		return new BufferFilePointer(this, content, extension);
	}

	fromData(content: Buffer, extension: string) {
		return this.fromContent(content, extension);
	}
}
