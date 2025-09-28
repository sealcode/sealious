import { Field, Context, Errors } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";
import humanComparatorToQuery, {
	type ComparatorObject,
	type HumanComparator,
	type DBComparator,
} from "../../../utils/human-comparator-to-query.js";

const DAY = 1000 * 60 * 60 * 24;

function dateStrToDayInt(date_str: string) {
	return Date.parse(date_str) / DAY;
}

export const DATE_FIELD_TYPE_NAME = "date";

/** Stores a date - without hours/minutes, just the day.
 *
 * **Params**: None
 */

export default class DateField extends Field<string, string | number, number> {
	typeName = DATE_FIELD_TYPE_NAME;

	open_api_type: OpenApiTypes = OpenApiTypes.DATE;

	async hasIndex(): Promise<boolean> {
		return true;
	}

	async isProperValue(context: Context, value: string) {
		if (value == null) {
			return Field.valid();
		}
		const date_in_string = value.toString();

		const regex = /^([0-9]{4})-(0?[1-9]|1[0-2])-([0-2]?[0-9]|30|31)$/; // granulation_per_day

		if (
			regex.test(date_in_string) === false ||
			isNaN(Date.parse(date_in_string))
		) {
			return Field.invalid(
				context.i18n`Value '${value}' is not date calendar format. Expected value in standard IS0 8601 (YYYY-MM-DD) format.`
			);
		}
		return Field.valid();
	}

	async encode(_: Context, value: string | null) {
		if (value === null) {
			return null;
		}
		const date_str = value.toString();
		// value is already confirmed to be properly formatted
		return dateStrToDayInt(date_str);
	}

	async getMatchQueryValue(
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
	async decode(
		_: Context,
		value_in_db: number | null,
		old_value: string,
		format: never
	) {
		if (value_in_db === null) {
			return value_in_db;
		}
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

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" DATE`];
	}
}
