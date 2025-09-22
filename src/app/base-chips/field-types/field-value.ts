// the goal is for every field's Decode value to return an instance of Field Value. FieldValue can be extended to have more formatting options instead of relying on "format";

export abstract class FieldValue {
	abstract getRestAPIValue(): unknown;
}
