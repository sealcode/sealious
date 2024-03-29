import type {
	Field,
	FieldOutput,
	App,
	Collection,
	CollectionItem,
	Context,
} from "../../../main";
import { HybridField, ValidationResult } from "../../../chip-types/field";
import isEmpty from "../../../utils/is-empty";
import { BadContext } from "../../../response/errors";
/*

todo: make the deriving_fn more type-safe by reading the types of the fields?

*/

export type DerivingFn<T extends Field> = (
	context: Context,
	item: CollectionItem,
	...args: any[]
) => Promise<FieldOutput<T>>;

export default class DerivedValue<T extends Field> extends HybridField<T> {
	typeName = "derived-value";

	fields: string[];
	deriving_fn: DerivingFn<T>;
	private blessed_symbol = Symbol();

	constructor(
		base_field: T,
		params: {
			fields: string[];
			deriving_fn: DerivingFn<T>;
		}
	) {
		super(base_field);
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
	}

	async init(app: App, collection: Collection): Promise<void> {
		await super.init(app, collection);
		for (const field of this.fields) {
			if (!collection.fields[field]) {
				throw new Error(
					`Collection '${collection.name}' does not have a field named '${field}', which was passed to DerivedValue`
				);
			}
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
		this.collection.on("before:create", async ([context, item]) => {
			context.app.Logger.debug2(
				"FIELD.DERIVED VALUE",
				"Before:create handler"
			);
			const derived_fn_args = this.fields.map((field_name) => {
				const value = item.body.getInput(field_name);
				return value === undefined || value === null ? "" : value;
			});
			context.app.Logger.debug3(
				"FIELD.DERIVED VALUE",
				"Passing to derived_fn:",
				derived_fn_args
			);
			const derived_value = await this.deriving_fn(
				context,
				item,
				...derived_fn_args
			);
			item.set(this.name, derived_value, this.blessed_symbol);
		});

		this.collection.on("before:edit", async ([context, item]) => {
			if (
				!this.fields.some((field) =>
					item.body.changed_fields.has(field)
				)
			) {
				return;
			}
			context.app.Logger.debug("DERIVED VALUE", "Handling before:edit", {
				item_body: item.body,
			});
			const derived_fn_args = await Promise.all(
				this.fields.map((field_name) =>
					item.getDecoded(field_name, context)
				)
			);
			const derived_value = await this.deriving_fn(
				context,
				item,
				...derived_fn_args
			);
			context.app.Logger.debug2("DERIVED VALUE", "Setting new value", {
				[this.name]: derived_value,
			});
			item.set(this.name, derived_value, this.blessed_symbol);
		});
	}

	async isProperValue(
		context: Context,
		new_value: Parameters<T["checkValue"]>[1],
		old_value: Parameters<T["checkValue"]>[2],
		new_value_blessing_token: symbol | null
	): Promise<ValidationResult> {
		if (
			!isEmpty(new_value) &&
			!context.is_super &&
			!(new_value_blessing_token == this.blessed_symbol)
		) {
			throw new BadContext("This is a read-only field");
		}
		return this.virtual_field.checkValue(
			context,
			new_value,
			old_value,
			new_value_blessing_token
		);
	}

	async hasIndex() {
		return await this.virtual_field.hasIndex();
	}
}
