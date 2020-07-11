import { Field } from "../../../main";
import TextStorage from "./text-storage";

export type TextParams = Partial<{
	full_text_search: boolean;
	min_length: number;
	max_length: number;
}>;

export default class Text extends TextStorage {
	getTypeName = () => "text";
	params: TextParams;

	hasIndex() {
		if (this.params.full_text_search) {
			return { original: "text" as "text" };
		} else {
			return false;
		}
	}

	async isProperValue(_: any, input: string) {
		if (typeof input !== "string") {
			return Field.invalid(
				`Type of ${input} is ${typeof input}, not string.`
			);
		}
		if (this.params.min_length && input.length < this.params.min_length) {
			return Field.invalid(
				`Text '${input}' is too short, minimum length is ${this.params.min_length} chars.`
			);
		}
		if (this.params.max_length && input.length > this.params.max_length) {
			return Field.invalid(
				`Text '${input}' has exceeded max length of ${this.params.max_length} chars.`
			);
		}
		return Field.valid();
	}

	setParams(params: TextParams) {
		this.params = params;
	}
}
