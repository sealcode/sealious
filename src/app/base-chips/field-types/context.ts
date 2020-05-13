import { Context, Field } from "../../../main";

export default class ContextField extends Field<
	{},
	Context,
	{ is_super: boolean; user_id: string }
> {
	getTypeName = () => "context";
	async isProperValue(_: Context, value: Context) {
		if (value instanceof Context) {
			return Field.valid();
		} else {
			return Field.invalid(
				"Provided value is not an instance of Sealious.Context"
			);
		}
	}
}
