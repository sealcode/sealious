import { Field, Context, Errors } from "../../../main";
import humanComparatorToQuery, {
	ComparatorObject,
	HumanComparator,
	DBComparator,
} from "../../../utils/human-comparator-to-query";

const DAY = 1000 * 60 * 60 * 24;

function dateStrToDayInt(date_str: string) {
	return Date.parse(date_str) / DAY;
}

/** Stores a date - without hours/minutes, just the day.
 *
 * **Params**: None
 */
export default class DateField extends Field {
	typeName = "date";
	async isProperValue(_: Context, value: string) {
		const date_in_string = value.toString();

		const regex = /^([0-9]{4})-(0?[1-9]|1[0-2])-([0-2]?[0-9]|30|31)$/; // granulation_per_day

		if (
			regex.test(date_in_string) === false ||
			isNaN(Date.parse(date_in_string))
		) {
			return Field.invalid(
				`Value "${value}" is not date calendar format. Expected value in standard IS0 8601 (YYYY-MM-DD) format`
			);
		}
		return Field.valid();
	}
	async encode(_: Context, value_in_code: string) {
		const date_str = value_in_code.toString();
		// value is already confirmed to be properly formatted
		return dateStrToDayInt(date_str);
	}
	async filterToQuery(
		_: Context,
		field_filter: string | ComparatorObject<string>
	) {
		if (typeof field_filter !== "object") {
			return {
				$eq: dateStrToDayInt(field_filter),
			};
		}
		// treating filter as a query here
		const new_filter: { [comparator in DBComparator]?: number } = {};
		for (const comparator in field_filter as ComparatorObject<string>) {
			const new_comparator = humanComparatorToQuery(
				comparator as HumanComparator
			);
			if (new_comparator === undefined) {
				throw new Errors.ValidationError(
					`Unknown comparator: '${comparator}'.`
				);
			}
			new_filter[new_comparator] = dateStrToDayInt(
				field_filter[comparator as HumanComparator]
			);
		}
		return new_filter;
	}
	async decode(
		_: Context,
		value_in_db: number,
		old_value: string,
		format: never
	) {
		const d = new Date(value_in_db * DAY);
		const month = d.getMonth() + 1;
		let month_str = month.toString();
		if (month < 10) {
			month_str = "0" + month_str;
		}
		return `${d.getFullYear()}-${month_str}-${
			d.getDate() < 10 ? "0" : ""
		}${d.getDate()}`;
	}
}
