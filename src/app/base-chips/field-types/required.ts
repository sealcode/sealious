import type { Field, RequiredField } from "../../../main";

export default function Required(T: Field): RequiredField {
	T.setRequired(true);
	return T as RequiredField;
}
