import {
	Field,
	Context,
	AccessStrategy,
	HybridField,
	App,
	ExtractStorage,
} from "../../../main";
import {
	ExtractParams,
	ExtractOutput,
	HybridFieldParams,
} from "../../../chip-types/field";

type Params<T extends Field> = {
	target_access_strategies: { [key in "show" | "edit"]: AccessStrategy };
	value_when_not_allowed: ExtractOutput<T>;
};

export default class ControlAccess<T extends Field> extends HybridField<T> {
	getTypeName = () => "control-access";
	edit_strategy: AccessStrategy;
	show_strategy: AccessStrategy;
	value_when_not_allowed: ExtractOutput<T>;
	app: App;
	setParams(params: Params<T> & HybridFieldParams<T>) {
		super.setParams(params);
		this.edit_strategy = params.target_access_strategies.edit;
		this.show_strategy = params.target_access_strategies.show;
		this.value_when_not_allowed = params.value_when_not_allowed;
	}

	async isProperValue(
		context: Context,
		new_value: Parameters<T["isProperValue"]>[1],
		old_value: Parameters<T["isProperValue"]>[2]
	) {
		if (!context.is_super) {
			const result = await this.edit_strategy.check(context);
			if (result && !result?.allowed) {
				return Field.invalid(result.reason);
			}
		}

		return this.virtual_field.isProperValue(context, new_value, old_value);
	}

	async decode(
		context: Context,
		value_in_db: ExtractStorage<T>,
		old_value: ExtractOutput<T>,
		format_params: ExtractParams<T>
	) {
		if (!context.is_super) {
			const result = await this.show_strategy.check(context);
			if (result && !result.allowed) {
				value_in_db = await this.encode(
					context,
					this.value_when_not_allowed
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
}
