import { Field } from "../../../main";
import { QueryStage } from "../../../datastore/query";
import escape from "escape-html";

type TextStorageFormat = { original: string; safe: string };
type TextFormatParam = keyof TextStorageFormat;

export default abstract class TextStorage extends Field {
	async encode(_: any, input: string) {
		return {
			original: input,
			safe: escape(input),
		};
	}

	async getAggregationStages(
		_: any,
		query_params: {
			filter: {
				[field_name: string]: string | { regex: string | RegExp };
			};
		}
	) {
		let filter_value =
			query_params.filter && query_params.filter[this.name];

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
		_: any,
		db_value: TextStorageFormat,
		__: any,
		format?: TextFormatParam
	) {
		if (db_value === null || db_value === undefined) {
			return db_value;
		}
		if (!format) {
			return (db_value as TextStorageFormat).safe;
		}
		return (
			(db_value as TextStorageFormat)[format] ||
			(db_value as TextStorageFormat).safe
		);
	}
}
