import { Field, Context } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

import flattenObjectToDotNotation from "../../../utils/flatten-object-dot-notation.js";

export default class JsonObject extends Field<Record<string, unknown>> {
	typeName = "json-object";

	open_api_type = OpenApiTypes.OBJECT;

	async isProperValue(context: Context, new_value: {}, __: {}) {
		let stringified_value;
		try {
			stringified_value = JSON.stringify(new_value);
		} catch (e) {
			return Field.invalid(
				context.app.i18n("invalid_json_object", [new_value])
			);
		}
		if (!stringified_value.startsWith("{")) {
			return Field.invalid(context.app.i18n("invalid_json_object"));
		}
		return Field.valid();
	}

	async encode(_: Context, value: {}) {
		if (value === null) {
			return null;
		}
		return JSON.parse(JSON.stringify(value));
	}

	async getAggregationStages(
		_: Context,
		filter_value: { [value: string]: any }
	) {
		// the following will pick only filters relating to this particular field and turn them into dot notation.
		// example when field "metadata" is of type json-object:
		//   {name: "Hoover", metadata: {"age": 22}}
		// will become
		//   {"metadata.age": 22 }
		// note that "name" is missing
		const flattened_filter = flattenObjectToDotNotation(
			await this.getValuePath(),
			filter_value || {}
		);
		for (const prop_path of Object.keys(flattened_filter)) {
			const filter_entry = flattened_filter[prop_path];
			flattened_filter[prop_path] =
				getQueryWithProperOperator(filter_entry);
		}
		return [{ $match: flattened_filter }];
	}
}

function getQueryWithProperOperator(filter: any) {
	const filter_as_number = parseFloat(filter);
	return Number.isFinite(filter_as_number)
		? { $in: [filter, filter_as_number] }
		: { $eq: filter };
}
