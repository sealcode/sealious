import { Field } from "../../../main";

export default function Required(T: Field) {
	T.setRequired(true);
	return T;
}
