import { Field, Context } from "../../../main";

type Props<S> = { values: S[] | (() => S[]) };

export default class Enum<S> extends Field<S> {
	getTypeName = () => "enum";
	allowed_values: S[];

	setParams(params: Props<S>) {
		this.allowed_values =
			params.values instanceof Function ? params.values() : params.values;
	}

	async isProperValue(_: Context, value: S) {
		if (this.allowed_values.includes(value)) {
			return Field.valid();
		} else {
			return Field.invalid(
				"Allowed values: " + this.allowed_values.join()
			);
		}
	}
}
