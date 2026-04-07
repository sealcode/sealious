/**
 * Helper function to extract string value from a field value.
 * Since TextValue extends String and all FieldValue types implement toString(),
 * we can simply use toString() for all values.
 *
 * @param value - The value from item.get() which might be a FieldValue object or a primitive
 * @returns The string representation of the value
 */
export function getFieldValueString(value: any): string {
	if (value === null || value === undefined) {
		return "";
	}
	return value.toString();
}
