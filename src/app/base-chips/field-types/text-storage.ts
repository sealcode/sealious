import { Field, Context } from "../../../main";
import type { QueryStage } from "../../../datastore/query";
import escape from "escape-html";
import { hasShape, is, predicates } from "@sealcode/ts-predicates";

type TextStorageFormat = { original: string; safe: string };
type TextFormatParam = keyof TextStorageFormat;

export default abstract class TextStorage extends Field {
	async encode(context: Context, input: string | null) {
		context.app.Logger.debug2("TEXT FIELD", "encode", {
			name: this.name,
			input,
		});
		if (input === null) {
			return null;
		}
		const ret = {
			original: input,
			safe: escape(input),
		};
		context.app.Logger.debug3("TEXT FIELD", "encode/return", ret);
		return ret;
	}

	private makeOriginalOrSafeQuery(
		value_path: string,
		text_value: string | { $regex: string; $options: string }
	) {
		return {
			$or: [
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
		context: Context,
		filter_value: string | { regex: string | RegExp } | string[]
	): Promise<any> {
		if (!filter_value) {
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

			return this.makeOriginalOrSafeQuery(value_path, filter_in_query);
		} else if (typeof filter_value === "string") {
			filter_in_query = filter_value;
			return this.makeOriginalOrSafeQuery(value_path, filter_in_query);
		} else if (is(filter_value, predicates.array(predicates.string))) {
			// array
			return {
				$or: filter_value.map((value) =>
					this.makeOriginalOrSafeQuery(value_path, value)
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
		db_value: TextStorageFormat | null,
		__: any,
		format?: TextFormatParam
	): Promise<string | null> {
		if (db_value === null) {
			return null;
		}
		context.app.Logger.debug2("TEXT FIELD", "decode", { db_value, format });
		let ret;
		if (db_value === null || db_value === undefined) {
			ret = db_value;
		} else if (!format) {
			ret = db_value.safe;
		} else {
			ret = db_value[format] || db_value.safe;
		}
		context.app.Logger.debug3("TEXT FIELD", "decode/return", ret);
		return ret;
	}
}
