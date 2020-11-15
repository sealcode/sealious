import { Context, Field } from "../../../main";
import isEmpty from "../../../utils/is-empty";

export default function Required(T: Field) {
	const original_check = T.isProperValue;
	T.setRequired(true);
	return T;
}
