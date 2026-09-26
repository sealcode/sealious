import { is, predicates } from "@sealcode/ts-predicates";
import {
	Field,
	type ExtractFieldDecoded,
	type ExtractFieldInput,
	type ExtractFieldStorage,
	type ValidationResult,
} from "../../../chip-types/field-base.js";
import type Context from "../../../context.js";
import type { OpenApiTypes, CollectionItem } from "../../../main.js";
import type { FieldValue } from "./field-value.js";

type StructuredValue<Structure extends Record<string, any>> = Structure & {
	getRestAPIValue(): Record<keyof Structure, unknown>;
	toValue(): Record<keyof Structure, unknown>;
};

function makeStructuredValue<Structure extends Record<string, any>>(
	data: Structure
): StructuredValue<Structure> {
	return {
		...data,
		getRestAPIValue(): Record<keyof Structure, unknown> {
			return Object.fromEntries(
				Object.entries(this)
					.filter(([, value]) => typeof value !== "function")
					.map(([key, value]) => {
						if (
							value &&
							typeof value === "object" &&
							"getRestAPIValue" in value
						) {
							return [
								key as keyof Structure,
								(value as FieldValue).getRestAPIValue(),
							] as const;
						}

						return [key as keyof Structure, value] as const;
					})
			) as Record<keyof Structure, unknown>;
		},
		toValue(): Record<keyof Structure, unknown> {
			return Object.fromEntries(
				Object.entries(this).filter(
					([, value]) => typeof value !== "function"
				)
			) as Record<keyof Structure, unknown>;
		},
	};
}

export class Structured<
	Structure extends Record<string, Field<any, any, any>>,
> extends Field<
	StructuredValue<{
		[key in keyof Structure]: ExtractFieldDecoded<Structure[key]>;
	}>,
	Partial<{ [key in keyof Structure]: ExtractFieldInput<Structure[key]> }>,
	{ [key in keyof Structure]: ExtractFieldStorage<Structure[key]> }
> {
	typeName: "structured";
	open_api_type: OpenApiTypes.OBJECT;

	constructor(public fields: Structure) {
		super();
		for (const key of Object.keys(fields)) {
			// eslint-disable-next-line @typescript-eslint/unbound-method
			const original_get_path = fields[key]!.getValuePath;
			fields[key]!.getValuePath = async () => {
				return `${this.name}.${await original_get_path.call(fields[key]!)}`;
			};
		}
	}

	async isProperValue(
		context: Context,
		new_value: unknown,
		old_value: unknown,
		_new_value_blessing_token: symbol | null,
		item: CollectionItem | undefined
	): Promise<ValidationResult> {
		if (new_value == undefined || new_value == null) {
			new_value = {};
		}
		if (!is(new_value, predicates.object)) {
			return { valid: false, reason: "not an object" };
		}
		if (old_value == undefined || old_value == null) {
			old_value = {};
		}
		if (!is(old_value, predicates.object)) {
			return { valid: false, reason: "old valuenot an object" };
		}
		for (const key of Object.keys(new_value)) {
			if (!(key in this.fields)) {
				delete new_value[key];
			}
		}
		const result = (
			await Promise.all(
				Object.keys(new_value).map(async (key) => {
					const field = this.fields[key]!;
					const new_v = new_value[key]!;
					const old_v = old_value?.[key];
					if (new_v == undefined) {
						return null;
					}
					return <const>[
						key,
						await field.isProperValue(
							context,
							new_v,
							old_v,
							null,
							item
						),
					];
				})
			)
		).filter((e) => e != null);
		return {
			valid: result.every(([, r]) => r.valid),
			reason: result
				.filter(([, r]) => r.reason)
				.map(([key, r]) => `${key}: ${r.reason}`)
				.join("; "),
		};
	}

	async encode(
		context: Context,
		value: Partial<{
			[key in keyof Structure]: ExtractFieldInput<Structure[key]>;
		}> | null
	): Promise<
		{ [key in keyof Structure]: ExtractFieldStorage<Structure[key]> } | null
	> {
		if (!value) {
			value = {};
		}

		const result = Object.fromEntries(
			await Promise.all(
				Object.entries(value)
					.filter(
						([key, value]) =>
							!!this.fields[key] && value != undefined
					)
					.map(async ([key, value]) => {
						const subfield = this.fields[key]!;
						return <const>[
							key as keyof Structure,
							await subfield.encode(context, value),
						];
					})
			)
		);
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return result as any;
	}

	async decode(
		context: Context,
		storage_value: {
			[key in keyof Structure]: ExtractFieldStorage<Structure[key]>;
		},
		_old_value: any,
		is_http: boolean
	): Promise<
		StructuredValue<{
			[key in keyof Structure]: ExtractFieldDecoded<Structure[key]>;
		}>
	> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		if (!storage_value) return {} as any;
		const result = Object.fromEntries(
			await Promise.all(
				Object.entries(storage_value)
					.filter(
						([key, value]) =>
							!!this.fields[key] && value != undefined
					)
					.map(async ([key, value]) => {
						const subfield = this.fields[key]!;
						return <const>[
							key as keyof Structure,
							await subfield.decode(
								context,
								value,
								null,
								is_http
							),
						];
					})
			)
		);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return makeStructuredValue(result as any);
	}
}
