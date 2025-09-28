import { URL } from "url";
import type { ValidationResult } from "../../../chip-types/field.js";
import { Field, Context } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

export type UrlParams = Partial<{
	allowed_origins: string[];
	allowed_protocols: string[];
}>;

export default class Url extends Field<string> {
	typeName = "url";
	params: UrlParams;

	open_api_type = OpenApiTypes.URI_REF;

	constructor(params: UrlParams = {}) {
		super();
		this.params = params;
	}

	async isProperValue(
		context: Context,
		value: string
	): Promise<ValidationResult> {
		const allowed_protocols = this.params.allowed_protocols
			? this.params.allowed_protocols.map((protocol) => `${protocol}:`)
			: [];
		let url;

		try {
			url = new URL(value);
		} catch (err) {
			return Field.invalid(err);
		}

		if (
			this.params.allowed_origins &&
			!this.params.allowed_origins.includes(url.hostname)
		) {
			return Field.invalid(
				context.i18n`Domain ${url.hostname} is not allowed here. Allowed domains are: [${this.params.allowed_origins.join(
					", "
				)}]`
			);
		}

		if (
			this.params.allowed_protocols &&
			!allowed_protocols.includes(url.protocol)
		) {
			return Field.invalid(
				context.i18n`Procotol ${url.protocol} is not accepted by this field. Allowed protocols are: [${this.params.allowed_protocols.join(
					", "
				)}]`
			);
		}

		return Field.valid();
	}

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" VARCHAR`];
	}
}
