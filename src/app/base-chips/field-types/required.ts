import type { Field, RequiredField } from "../../../main.js";

export default function Required<InputType, DecodedType, StorageType>(
	T: Field<InputType, DecodedType, StorageType>
): RequiredField<InputType, DecodedType, StorageType> {
	T.setRequired(true);
	return T as RequiredField<InputType, DecodedType, StorageType>;
}
