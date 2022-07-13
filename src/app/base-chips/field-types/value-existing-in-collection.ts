import Field from "../../../chip-types/field";
import type { Context, App } from "../../../main";

export default class ValueExistingInCollection extends Field {
	typeName = "value-existing-in-collection";
	target_field_name: string;
	target_collection_name: string;
	include_forbidden: boolean;

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
		const collection = field.collection;
		const result = await field.checkValue(context, new_value, old_value);
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
		return app.collections[this.target_collection_name].fields[
			this.target_field_name
		];
	}

	encode(...args: Parameters<Field["encode"]>) {
		return this.getField(args[0].app).encode(...args);
	}

	decode(...args: Parameters<Field["decode"]>) {
		return this.getField(args[0].app).decode(...args);
	}

	filterToQuery(...args: Parameters<Field["filterToQuery"]>) {
		return this.getField(args[0].app).filterToQuery(...args);
	}

	getAggregationStages(...args: Parameters<Field["getAggregationStages"]>) {
		return this.getField(args[0].app).getAggregationStages(...args);
	}
}
