import { Context, Field, ValidationResult } from "../../../main";
import Text from "./text";
import JsonObject from "./json-object";
import { StructuredArray } from "./structured-array";

export type JDDocument = Array<{
	component_name: string;
	args: Record<string, unknown>;
}>;

export default class JDD extends StructuredArray<{
	component_name: Text;
	args: JsonObject;
}> {
	typeName = "jdd";

	constructor(private allowedComponents: string[] | null = null) {
		super({
			component_name: new Text(),
			args: new JsonObject(),
		});
	}

	async isProperValue(
		context: Context,
		new_value: unknown
	): Promise<ValidationResult> {
		const names = (new_value as JDDocument).map(
			(item) => item.component_name
		);
		if (this.allowedComponents !== null) {
			const whitelist = this.allowedComponents;
			const names_valid = names.every((name) => whitelist.includes(name));

			if (!names_valid) {
				return Promise.resolve(
					Field.invalid("Some of the components are not allowed here")
				);
			}
		}
		return Promise.resolve(Field.valid());
	}

	public getAllowedComponents(): string[] | null {
		return this.allowedComponents;
	}
}
