import { hasShape, is, predicates } from "@sealcode/ts-predicates";
import Field, { type ValidationResult } from "../../../chip-types/field.js";
import type Context from "../../../context.js";
import type { OpenApiTypes } from "../../../schemas/open-api-types.js";
import * as countryCodes from "country-codes-list";
import { FieldValue } from "./field-value.js";

export class PhoneNumberValue extends FieldValue {
	constructor(
		public country_code: string,
		public number: string
	) {
		super();
		this.number = number.replaceAll(/[^0-9]/g, "");
	}

	getRestAPIValue(): string {
		return this.toString();
	}

	static fromObject(
		ctx: Context,
		value: { country_code: string; number: string }
	) {
		value.country_code = value.country_code.replaceAll(/[^0-9]/g, "");
		const countryData = countryCodes.findOne(
			"countryCallingCode",
			value.country_code
		);
		if (!countryData) {
			throw new Error(
				ctx.app.i18n("phone_number_error_unknown_country_code", [
					value.country_code,
				])
			);
		}
		const number = value.number.replaceAll(/[^0-9]/g, "");
		return new PhoneNumberValue(value.country_code, number);
	}

	static fromString(ctx: Context, value: string) {
		if (!value.includes(" ")) {
			throw new Error(
				ctx.app.i18n("phone_number_error_should_have_space")
			);
		}
		const [country_code, ...rest] = value.split(" ");
		return PhoneNumberValue.fromObject(ctx, {
			country_code: country_code || "",
			number: rest.join(""),
		});
	}

	static fromInput(ctx: Context, value: unknown) {
		if (value instanceof PhoneNumberValue) {
			return value;
		}
		if (
			Array.isArray(value) &&
			value.length == 2 &&
			is(value, predicates.array(predicates.string))
		) {
			const [country_code, number] = value as [string, string];
			return PhoneNumberValue.fromObject(ctx, { country_code, number });
		}
		if (typeof value == "string") {
			return PhoneNumberValue.fromString(ctx, value);
		}
		if (
			hasShape(
				{ country_code: predicates.string, number: predicates.string },
				value
			)
		) {
			return PhoneNumberValue.fromObject(ctx, value);
		}
		throw new Error(
			ctx.app.i18n("phone_number_error_has_to_be_string_or_object")
		);
	}

	getNumberPartWithSpaces() {
		const digits = this.number.replace(/\D/g, "");

		if (digits.length === 10) {
			return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
		}

		return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
	}

	toString() {
		return `+${this.country_code} ${this.getNumberPartWithSpaces()}`;
	}

	toDB() {
		return { country_code: this.country_code, number: this.number };
	}
}

export class PhoneNumber extends Field<
	PhoneNumberValue,
	PhoneNumberValue | [country_code: string, number: string] | string,
	{ country_code: string; number: string }
> {
	typeName = "phone-number";

	open_api_type: OpenApiTypes.STR;

	protected async isProperValue(
		context: Context,
		new_value: unknown
	): Promise<ValidationResult> {
		try {
			const result = PhoneNumberValue.fromInput(
				context,
				new_value as string
			);
			return { valid: true };
		} catch (e) {
			return { valid: false, reason: e.message };
		}
	}

	async encode(
		ctx: Context,
		value: PhoneNumberValue | [country_code: string, number: string] | null
	): Promise<{ country_code: string; number: string } | null> {
		return PhoneNumberValue.fromInput(ctx, value).toDB();
	}

	async decode(
		context: Context,
		storage_value: { country_code: string; number: string }
	): Promise<PhoneNumberValue | null> {
		if (!storage_value) {
			return null;
		} else {
			return PhoneNumberValue.fromObject(context, storage_value);
		}
	}
}
