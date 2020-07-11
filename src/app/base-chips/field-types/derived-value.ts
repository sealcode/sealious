import {
	HybridField,
	Field,
	ExtractOutput,
	App,
	Context,
	HybridFieldParams,
} from "../../../main";
import Bluebird from "bluebird";

/*

todo: make the deriving_fn more type-safe by reading the types of the fields?

*/

export type DerivingFn<T extends Field> = (
	...args: any[]
) => Promise<ExtractOutput<T>>;

export default class DerivedValue<T extends Field> extends HybridField<T> {
	getTypeName = () => "derived-value";

	fields: string[];
	deriving_fn: DerivingFn<T>;

	private async checkAllCollectionFields(
		context: Context,
		event_params: { [field_name: string]: any }
	) {
		for (const field_name in event_params) {
			try {
				await this.collection.fields[field_name].isProperValue(
					context,
					event_params[field_name],
					null
				);
			} catch (e) {
				return;
			}
		}
	}

	setParams(
		params: HybridFieldParams<T> & {
			fields: string[];
			deriving_fn: DerivingFn<T>;
		}
	) {
		if (this.app.status !== "stopped") {
			throw new Error(
				"Cannot add this kind of field after the app has started"
			);
		}
		if (typeof params.deriving_fn !== "function") {
			throw new Error(
				"Error: 'deriving_fn' param in name_and_surname derived-value field is not a function."
			);
		}
		super.setParams(params);
		this.fields = params.fields;
		this.deriving_fn = params.deriving_fn;

		if (typeof this.deriving_fn !== "function") {
			throw new Error(
				`'derived_fn' param in ${this.name} derived-value field is not a function.`
			);
		}

		if (!Array.isArray(this.fields)) {
			throw new Error(
				`'fields' param in ${this.name} derived-value field is not an array.`
			);
		}

		const not_matching_fields = this.fields.filter(
			(field) => !Object.keys(this.collection.fields).includes(field)
		);

		if (not_matching_fields.length) {
			throw new Error(
				`Missing declaration for fields from derived-value params: ${not_matching_fields
					.map((field) => `'${field}'`)
					.join(", ")} in ${
					this.collection.name
				} collection. REMEMBER: 'derived-value' field must be declared *after* the fields it depends on.`
			);
		}
	}

	async init(app: App) {
		app.addHook(
			new app.Sealious.EventMatchers.Collection({
				when: "before",
				collection_name: this.collection.name,
				action: "create",
			}),
			async (event, params) => {
				this.checkAllCollectionFields(event.metadata.context, params);
				const derived_fn_args = this.fields.map((field_name) =>
					params[field_name] === undefined ||
					params[field_name] === null
						? ""
						: params[field_name]
				);
				const derived_value = await this.deriving_fn(
					...derived_fn_args
				);
				return {
					[this.name]: derived_value,
					...params,
				};
			}
		);

		app.addHook(
			new app.Sealious.EventMatchers.Resource({
				when: "before",
				collection_name: this.collection.name,
				action: "edit",
			}),
			async ({ metadata, subject_path }, params) => {
				this.checkAllCollectionFields(metadata.context, params);

				if (
					this.fields.some((field) =>
						Object.keys(params).includes(field)
					)
				) {
					const derived_fn_args = await Bluebird.map(
						this.fields,
						async (field_name) => {
							if (Object.keys(params).includes(field_name)) {
								return params[field_name];
							}
							const sealious_response = await app.runAction(
								new app.SuperContext(),
								subject_path.split("."),
								"show"
							);
							return sealious_response[field_name];
						}
					);
					const derived_value = await this.deriving_fn(
						...derived_fn_args
					);

					const ret = {
						...params,
						[this.name]: derived_value,
					};
					return ret;
				}
				return params;
			},
			true
		);
	}
}
