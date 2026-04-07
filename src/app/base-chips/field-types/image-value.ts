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

	toPath(): string {
		return this.file.getURL();
	}

	toUrl(): string {
		return `${this.base_url}${this.toPath()}`;
	}

	toString(): string {
		return this.toPath();
	}

	getRestAPIValue(): string | PathFilePointer {
		return this.restPreference === "absolute"
			? this.toUrl()
			: this.toPath();
	}
}
