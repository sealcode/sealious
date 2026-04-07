import { Field, Context } from "../../../main.js";
import escape from "escape-html";
import { hasShape, is, predicates } from "@sealcode/ts-predicates";

import { OpenApiTypes } from "../../../schemas/open-api-types.js";
import { TextValue } from "./text-value.js";

type LegacyTextStorageFormat = { original: string; safe: string };
type TextStorageFormat = string | LegacyTextStorageFormat;

export default abstract class TextStorage extends Field<
	TextValue,
	string,
	string
> {
	open_api_type: OpenApiTypes = OpenApiTypes.STR;

	async encode(context: Context, input: string | null) {
		context.app.Logger.debug2("TEXT FIELD", "encode", {
			name: this.name,
			input,
		});
		if (input === null) {
			return null;
		}
		context.app.Logger.debug3("TEXT FIELD", "encode/return", input);
		return input;
	}

	private makeTextQuery(
		value_path: string,
		text_value: string | { $regex: string; $options: string }
	) {
		return {
			$or: [
				{
					[`${value_path}`]: text_value,
				},
				{
					[`${value_path}.original`]: text_value,
				},
				{
					[`${value_path}.safe`]: text_value,
				},
			],
		};
	}

	async getMatchQueryValue(
		_context: Context,
		filter_value: string | { regex: string | RegExp } | string[]
	): Promise<any> {
		if (!filter_value && !(filter_value == "")) {
			return;
		}

		let filter_in_query;

		const value_path = await this.getValuePath();
		if (
			is(filter_value, predicates.object) &&
			hasShape({ regex: predicates.string }, filter_value) &&
			filter_value?.regex
		) {
			filter_in_query = <const>{
				$regex: filter_value.regex,
				$options: "i",
			};

			return this.makeTextQuery(value_path, filter_in_query);
		} else if (typeof filter_value === "string") {
			filter_in_query = filter_value;
			return this.makeTextQuery(value_path, filter_in_query);
		} else if (is(filter_value, predicates.array(predicates.string))) {
			// array
			return {
				$or: filter_value.map((value) =>
					this.makeTextQuery(value_path, value)
				),
			};
		} else {
			throw new Error("Invalid field value");
		}
	}

	async getMatchQuery(context: Context, filter: any): Promise<any> {
		return this.getMatchQueryValue(context, filter); // without wrapping it in a field path, as the default method in Field does
	}

	async getAggregationStages(
		context: Context,
		filter_value: string | { regex: string | RegExp } | string[]
	) {
		return [
			{ $match: await this.getMatchQueryValue(context, filter_value) },
		];
	}

	async decode(
		context: Context,
		db_value: TextStorageFormat | null | undefined,
		__: any,
		_is_http_api_request = false
	): Promise<TextValue | null> {
		if (db_value === null || db_value === undefined) {
			return null;
		}
		context.app.Logger.debug2("TEXT FIELD", "decode", { db_value });
		let original: string;
		if (typeof db_value === "string") {
			original = db_value;
		} else {
			original = db_value.original;
		}
		const ret = new TextValue(original);
		context.app.Logger.debug3("TEXT FIELD", "decode/return", ret);
		return ret;
	}
}
