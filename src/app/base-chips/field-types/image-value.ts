import type { PathFilePointer } from "@sealcode/file-manager";
import type { FieldValue } from "./field-value.js";

type RestPreference = "relative" | "absolute";

export class ImageValue implements FieldValue {
	constructor(
		private readonly file: PathFilePointer,
		private readonly base_url: string,
		private readonly restPreference: RestPreference
	) {}

	toFile(): PathFilePointer {
		return this.file;
	}

	async toPath(): Promise<string> {
		return this.file.getPath();
	}

	toUrl(with_host: boolean = true): string {
		return `${with_host ? this.base_url : ""}${this.file.getURL()}`;
	}

	toString(): string {
		return this.toUrl(true);
	}

	getRestAPIValue(): string | PathFilePointer {
		return this.restPreference === "absolute"
			? this.toUrl(true)
			: this.toUrl(false);
	}
}
