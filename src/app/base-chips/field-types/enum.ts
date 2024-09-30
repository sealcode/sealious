import { Field, Context, App } from "../../../main.js";

type Props<S> = S[] | ((app: App) => S[]);

/** Allows only a specified set of values.
 *
 * **Params**:
 * - `allowed_values` - `Array<any>` - list of acceptable values
 */
export default class Enum<S> extends Field<string> {
	typeName = "enum";
	allowed_values: Props<S>;

	constructor(allowed_values: Props<S>) {
		super();
		this.allowed_values = allowed_values;
	}

	getAllowedValues(app: App): S[] {
		return this.allowed_values instanceof Function
			? this.allowed_values(app)
			: this.allowed_values;
	}

	async isProperValue(context: Context, value: S) {
		if (this.getAllowedValues(context.app).includes(value)) {
			return Field.valid();
		} else {
			return Field.invalid(
				context.app.i18n("invalid_enum", [
					this.getAllowedValues(context.app).join(),
				])
			);
		}
	}

	async hasIndex(): Promise<boolean> {
		return true;
	}
}
