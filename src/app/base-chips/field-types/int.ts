import { Field, Context, Errors } from "../../../main.js";
import humanComparatorToQuery, {
	ComparatorObject,
	HumanComparator,
	DBComparator,
} from "../../../utils/human-comparator-to-query.js";

export type IntStorageParams = { min?: number; max?: number };

/** A field that stores it's value as an integer number. Can be configured to accept only values within specified range.
 *
 * **Params**:
 * - `min` - `Number` - (optional) the minimum acceptable value
 * - `max` - `Number` - (optional) the maximum acceptable value
 *
 * **Filters**:
 * When filtering a list of resources, one can use wither a simple equality test, or a more complex range comparison. Consult the examples below:
 * - `{ age: 2 }`
 * - `{ age: {">": 2}}`
 * - `{ age: {">": 2, "<" 10}}`
 */
export abstract class IntStorage<
	Input extends number | string,
	Output = any,
	Format = any
> extends Field {
	/** the min allowed value */
	min?: number;
	/** tha max allowed value*/
	max?: number;

	async isProperValue(context: Context, new_value: number | string) {
		const number = parseInt(new_value.toString(), 10);

		if (
			number.toString() !== new_value.toString().trim() ||
			number === null ||
			isNaN(number)
		) {
			return Field.invalid(
				context.app.i18n("invalid_integer", [new_value])
			);
		}

		if (this.min !== undefined && new_value < this.min) {
			return Field.invalid(
				context.app.i18n("too_small_integer", [number, this.min])
			);
		}
		if (this.max !== undefined && new_value > this.max) {
			return Field.invalid(
				context.app.i18n("too_big_integer", [number, this.max])
			);
		}
		return Field.valid();
	}

	constructor(params: IntStorageParams = {}) {
		super();
		this.max = params.max;
		this.min = params.min;
	}

	async getMatchQueryValue(
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

	encode = async (_: Context, value: number | string | null) => {
		if (value === null) {
			return null;
		}
		if (value === null) {
			return null;
		}
		const ret = parseInt(value.toString(), 10);
		return ret;
	};
}

/** An integer field. Consult {@link IntStorage} for information on
 * customizing it's behavior.*/
export default class Int extends IntStorage<number | string, number> {
	typeName = "int";
}
