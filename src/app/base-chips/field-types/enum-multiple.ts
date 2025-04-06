import { is, predicates } from "@sealcode/ts-predicates";
import { Field, Context } from "../../../main.js";
import { ArrayStorage } from "./array-storage.js";
import {
	OpenApiTypeMapping,
	OpenApiTypes,
} from "../../../schemas/open-api-types.js";

export class EnumMultiple<Values extends string> extends ArrayStorage<Values> {
	typeName = "enum-multiple";

	open_api_type = OpenApiTypes.NONE; // array - custom type generation

	async getOpenApiSchema(context: Context): Promise<Record<string, unknown>> {
		return {
			type: "array",
			items: {
				...OpenApiTypeMapping[OpenApiTypes.STR],
				enum: await this.getAllowedValues(context),
			},
		};
	}

	constructor(
		public allowed_values: Values[] | ((context: Context) => Values[])
	) {
		super(predicates.string);
	}

	async getEmptyElement(context: Context): Promise<Values> {
		const allowedValues = (await this.getAllowedValues(context))[0];
		if (allowedValues) {
			return allowedValues;
		} else {
			throw new Error("No allowed values found for the provided context");
		}
	}

	async getAllowedValues(context: Context): Promise<Values[]> {
		if (typeof this.allowed_values === "function") {
			return this.allowed_values(context);
		} else {
			return this.allowed_values;
		}
	}

	async isProperValue(ctx: Context, value: string[]) {
		if (!is(value, predicates.array(predicates.string))) {
			return Field.invalid("Not an array of strings");
		}
		const allowed_values = await this.getAllowedValues(ctx);
		const bad_values = value.filter(
			(v) => !allowed_values.includes(v as Values)
		);

		if (bad_values.length) {
			return Field.invalid(`Invalid values: ${bad_values.join(",")}`);
		}
		return Field.valid();
	}

	async encode(_: Context, value: Values[]) {
		return value;
	}
}
