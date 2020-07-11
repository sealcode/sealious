import { Field, Context, Errors } from "../../../main";
import humanComparatorToQuery, {
	ComparatorObject,
	HumanComparator,
	DBComparator,
} from "../../../utils/human-comparator-to-query";

export type IntStorageParams = { min?: number; max?: number };

export abstract class IntStorage<
	Input extends number | string,
	Output = any,
	Format = any
> extends Field<Input, Output, Format> {
	min?: number;
	max?: number;

	async isProperValue(_: Context, new_value: number | string) {
		const number = parseInt(new_value.toString(), 10);

		if (
			number.toString() !== new_value.toString().trim() ||
			number === null ||
			isNaN(number)
		) {
			return Field.invalid(
				`Value '${new_value}' is not a int number format.`
			);
		}

		if (this.min !== undefined && new_value < this.min) {
			return Field.invalid(
				`Value ${number} should be larger than or equal to ${this.min}`
			);
		}
		if (this.max !== undefined && new_value > this.max) {
			return Field.invalid(
				`Value ${number} should be smaller than or equal to ${this.max}`
			);
		}
		return Field.valid();
	}

	setParams(params: IntStorageParams) {
		this.max = params.max;
		this.min = params.min;
	}

	async filterToQuery(
		_: Context,
		field_filter: number | string | ComparatorObject<number>
	) {
		if (typeof field_filter !== "object") {
			return {
				$eq: parseInt(field_filter.toString(), 10),
			};
		}
		// treating filter as a query here
		const new_filter: { [db_comp in DBComparator]?: number } = {};
		for (const comparator in field_filter) {
			const new_comparator = humanComparatorToQuery(
				comparator as HumanComparator
			);
			if (new_comparator === undefined) {
				throw new Errors.ValidationError(
					`Unknown comparator: '${comparator}'.`
				);
			}
			new_filter[new_comparator] = parseInt(
				field_filter[comparator as HumanComparator].toString(),
				10
			);
		}
		return new_filter;
	}

	encode = async (_: Context, value_in_code: number | string | null) => {
		if (value_in_code === null) {
			return null;
		}
		const ret = parseInt(value_in_code.toString(), 10);
		return ret;
	};
}

export default class Int extends IntStorage<number | string, number> {
	getTypeName = () => "int";
}
