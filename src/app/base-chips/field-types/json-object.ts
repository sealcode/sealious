import { Field, Context } from "../../../main";

import flattenObjectToDotNotation from "../../../utils/flatten-object-dot-notation";

export default class JsonObject extends Field<{}> {
	getTypeName = () => "json-object";

	async isProperValue(_: Context, new_value: {}, __: {}) {
		let stringified_value;
		try {
			stringified_value = JSON.stringify(new_value);
		} catch (e) {
			return Field.invalid(
				`Value ${new_value} cannot be represented as JSON object`
			);
		}
		if (!stringified_value.startsWith("{")) {
			return Field.invalid("A primitive, not an object!");
		}
		return Field.valid();
	}

	async encode(_: Context, value: {}) {
		return JSON.parse(JSON.stringify(value));
	}

	async getAggregationStages(
		_: Context,
		{ filter }: Parameters<Field["getAggregationStages"]>[1]
	) {
		if (!filter) {
			return [];
		}

		// the following will pick only filters relating to this particular field and turn them into dot notation.
		// example when field "metadata" is of type json-object:
		//   {name: "Hoover", metadata: {"age": 22}}
		// will become
		//   {"metadata.age": 22 }
		// note that "name" is missing
		const flattened_filter = flattenObjectToDotNotation(
			await this.getValuePath(),
			filter[this.name] || {}
		);
		for (let prop_path of Object.keys(flattened_filter)) {
			const filter_entry = flattened_filter[prop_path];
			flattened_filter[prop_path] = getQueryWithProperOperator(
				filter_entry
			);
		}
		return [{ $match: flattened_filter }];
	}
}

function getQueryWithProperOperator(filter: any) {
	let filter_as_number = parseFloat(filter);
	return Number.isFinite(filter_as_number)
		? { $in: [filter, filter_as_number] }
		: { $eq: filter };
}
