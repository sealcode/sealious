import { Field, Context } from "../../../main";
import { QueryStage } from "../../../datastore/query";
import escape from "escape-html";

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

	async getAggregationStages(
		_: Context,
		filter_value: string | { regex: string | RegExp }
	) {
		if (!filter_value) {
			return [];
		}

		let filter_in_query: Object | string;

		if (typeof filter_value !== "string" && filter_value?.regex) {
			const regex_options = "i";
			filter_in_query = {
				$regex: filter_value.regex,
				$options: regex_options,
			};
		} else {
			filter_in_query = filter_value;
		}
		return [
			{
				$match: {
					$or: [
						{
							[`${await this.getValuePath()}.original`]: filter_in_query,
						},
						{
							[`${await this.getValuePath()}.safe`]: filter_in_query,
						},
					],
				},
			} as QueryStage,
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
