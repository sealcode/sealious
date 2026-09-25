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

export class Structured<
	Structure extends Record<string, Field<any, any, any>>,
> extends Field<
	{
		[key in keyof Structure]: ExtractFieldDecoded<Structure[key]>;
	},
	{ [key in keyof Structure]: ExtractFieldInput<Structure[key]> },
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
		const result = await Promise.all(
			Object.keys(new_value).map(async (key) => {
				const field = this.fields[key]!;
				const new_v = new_value[key]!;
				const old_v = old_value?.[key];
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
		);
		return {
			valid: result.every(([, r]) => r.valid),
			reason: result.map(([key, r]) => `${key}: ${r.reason}`).join("; "),
		};
	}
}
