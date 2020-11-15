import { Context, Field } from "../../../main";
import isEmpty from "../../../utils/is-empty";

export default function Required(T: Field) {
	const original_check = T.isProperValue;
	T.isProperValue = async function (
		context: Context,
		new_value: any,
		old_value: any
	) {
		if (isEmpty(new_value)) {
			return Field.invalid(`Missing value for field '${this.name}'.`);
		}
		return original_check.apply(T, [context, new_value, old_value]);
	};
	return T;
}
