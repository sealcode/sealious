import { Field, Context, Policy, App, ExtractStorage } from "../../../main";
import {
	ExtractParams,
	FieldOutput,
	HybridField,
} from "../../../chip-types/field";

type Params<T extends Field> = {
	target_policies: { [key in "show" | "edit"]: Policy };
	value_when_not_allowed: FieldOutput<T>;
};

export default class ControlAccess<T extends Field> extends HybridField<T> {
	typeName = "control-access";
	edit_strategy: Policy;
	show_strategy: Policy;
	value_when_not_allowed: FieldOutput<T>;
	app: App;

	constructor(base_field: T, params: Params<T>) {
		super(base_field);
		this.edit_strategy = params.target_policies.edit;
		this.show_strategy = params.target_policies.show;
		this.value_when_not_allowed = params.value_when_not_allowed;
	}

	async isProperValue(
		context: Context,
		new_value: Parameters<T["checkValue"]>[1],
		old_value: Parameters<T["checkValue"]>[2],
		new_value_blessing_token: symbol | null
	) {
		if (!context.is_super) {
			const result = await this.edit_strategy.check(context);
			if (result && !result?.allowed) {
				return Field.invalid(result.reason);
			}
		}

		return this.virtual_field.checkValue(
			context,
			new_value,
			old_value,
			new_value_blessing_token
		);
	}

	async decode(
		context: Context,
		value_in_db: ExtractStorage<T>,
		old_value: FieldOutput<T>,
		format_params: ExtractParams<T>
	) {
		if (!context.is_super) {
			context.app.Logger.debug2(
				"CONTROL ACCESS",
				`Checking the access to field ${this.name}...`,
				{ value_in_db }
			);
			const result = await this.show_strategy.check(context);
			if (result && !result.allowed) {
				context.app.Logger.debug2(
					"CONTROL ACCESS",
					`Access to field '${this.name}' not allowed!`,
					result
				);
				value_in_db = await this.encode(
					context,
					this.value_when_not_allowed
				);
			} else if (result?.allowed) {
				context.app.Logger.debug2(
					"CONTROL ACCESS",
					`Access to field '${this.name}' is allowed!`,
					result
				);
			}
		}

		const ret = await this.virtual_field.decode(
			context,
			value_in_db,
			old_value,
			format_params
		);
		return ret;
	}

	hasDefaultValue() {
		return this.virtual_field.hasDefaultValue();
	}

	getDefaultValue(context: Context) {
		return this.virtual_field.getDefaultValue(context);
	}
}
