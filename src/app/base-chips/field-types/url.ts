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
				context.app.i18n("not_allowed_domain", [
					url.hostname,
					this.params.allowed_origins,
				])
			);
		}

		if (
			this.params.allowed_protocols &&
			!allowed_protocols.includes(url.protocol)
		) {
			return Field.invalid(
				context.app.i18n("not_allowed_protocol", [
					url.protocol,
					this.params.allowed_protocols,
				])
			);
		}

		return Field.valid();
	}
}
