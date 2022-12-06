import type { Field, RequiredField } from "../../../main";

export default function Required<InputType>(
	T: Field<InputType>
): RequiredField<InputType> {
	T.setRequired(true);
	return T as RequiredField<InputType>;
}
