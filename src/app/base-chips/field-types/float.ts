import type { ValidationResult } from "../../../chip-types/field.js";
import { Context, Errors, Field } from "../../../main.js";
import humanComparatorToQuery, {
	ComparatorObject,
	DBComparator,
	HumanComparator,
} from "../../../utils/human-comparator-to-query.js";

/** Stores a floating point number. Does not take params. Does not allow range filtering. @todo: add range filtering */
export default class Float<Decoded = number> extends Field<
	Decoded,
	string | number,
	number
> {
	typeName = "float";
	async isProperValue(
		context: Context,
		input: number
	): Promise<ValidationResult> {
		const test = parseFloat(input.toString());
		if (test === null || isNaN(test) || isNaN(input) === true) {
			return Field.invalid(context.app.i18n("invalid_float", [input]));
		} else {
			return Field.valid();
		}
	}

	async getMatchQueryValue(
		_: Context,
		field_filter: number | string | ComparatorObject<number>
	) {
		if (typeof field_filter !== "object") {
			return {
				$eq: parseFloat(field_filter.toString()),
			};
		}
		// treating filter as a query here
		const new_filter: { [db_comp in DBComparator]?: number } = {};
		for (const comparator in field_filter) {
			if (!comparator) {
				continue;
			}
			const new_comparator = humanComparatorToQuery(
				comparator as HumanComparator
			);
			if (new_comparator === undefined) {
				throw new Errors.ValidationError(
					`Unknown comparator: '${comparator}'.`
				);
			}
			const value =
				field_filter[comparator as HumanComparator]?.toString();
			if (value === undefined) {
				continue;
			}
			new_filter[new_comparator] = parseInt(value, 10);
		}
		return new_filter;
	}

	async encode(_: any, value: number | string) {
		if (value === null) {
			return null;
		}
		const parsed_float = parseFloat(value.toString());
		return parsed_float;
	}
}
