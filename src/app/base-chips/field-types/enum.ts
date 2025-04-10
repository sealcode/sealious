import { Field, Context, App } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";

type Props<S> = S[] | ((app: App) => S[]);

/** Allows only a specified set of values.
 *
 * **Params**:
 * - `allowed_values` - `Array<any>` - list of acceptable values
 */
export default class Enum<S> extends Field<string> {
	typeName = "enum";
	allowed_values: Props<S>;

	open_api_type: OpenApiTypes = OpenApiTypes.STR;

	async getOpenApiSchema(context: Context): Promise<Record<string, unknown>> {
		return {
			...(await super.getOpenApiSchema(context)),
			enum: this.getAllowedValues(context.app),
		};
	}

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

	getPostgreSqlFieldDefinitions(): string[] {
		return [`"${this.name}" VARCHAR`];
	}
}
