import Field from "../../../chip-types/field.js";
import type { Context, App } from "../../../main.js";
import { OpenApiTypes } from "../../../schemas/open-api-types.js";
import type { ExtractTail } from "../../../utils/extract-tail.js";

export default class ValueExistingInCollection extends Field<unknown> {
	typeName = "value-existing-in-collection";
	target_field_name: string;
	target_collection_name: string;
	include_forbidden: boolean;

	open_api_type = OpenApiTypes.NONE; // unknown without context :C

	constructor(params: {
		field: string;
		collection: string;
		include_forbidden: boolean;
	}) {
		super();
		this.target_field_name = params.field;
		this.target_collection_name = params.collection;
		this.include_forbidden = params.include_forbidden;
	}

	async isProperValue(
		context: Context,
		new_value: unknown,
		old_value: unknown
	) {
		const field = this.getField(context.app);

		if (!field) {
			throw new Error("field is missing");
		}

		const collection = field.collection;
		const result = await field.checkValue(
			context,
			new_value,
			old_value,
			null
		);
		if (!result.valid) {
			return result;
		}
		if (this.include_forbidden) {
			context = new this.app.SuperContext();
		}

		const sealious_response = await collection
			.list(context)
			.filter({ [field.name]: new_value })
			.fetch();

		if (sealious_response.empty) {
			return Field.invalid(
				context.app.i18n("invalid_existing_value", [
					collection.name,
					field.name,
					new_value,
				])
			);
		}
		return Field.valid();
	}

	getField(app: App) {
		const targetCollection = app.collections[this.target_collection_name];
		if (targetCollection) {
			return targetCollection.fields[this.target_field_name];
		} else {
			throw new Error(
				`target collection is missing: "${this.target_collection_name}"`
			);
		}
	}

	encode(
		context: Context,
		...args: ExtractTail<Parameters<Field<unknown>["encode"]>>
	): Promise<unknown> {
		const field = this.getField(context.app);
		if (field) {
			return field.encode(context, ...args);
		} else {
			throw new Error(`field is missing: "${this.target_field_name}"`);
		}
	}

	decode(
		context: Context,
		...args: ExtractTail<Parameters<Field<unknown>["decode"]>>
	) {
		const field = this.getField(context.app);
		if (field) {
			return field.decode(context, ...args);
		} else {
			throw new Error(`field is missing: "${this.target_field_name}"`);
		}
	}

	getMatchQueryValue(
		context: Context,
		...args: ExtractTail<Parameters<Field<unknown>["getMatchQueryValue"]>>
	) {
		const field = this.getField(context.app);
		if (field) {
			return field.getMatchQueryValue(context, ...args);
		} else {
			throw new Error("field is missing");
		}
	}

	getAggregationStages(
		context: Context,
		...args: ExtractTail<Parameters<Field<unknown>["getMatchQueryValue"]>>
	) {
		const field = this.getField(context.app);
		if (field) {
			return field.getAggregationStages(context, ...args);
		} else {
			throw new Error("field is missing");
		}
	}
}
