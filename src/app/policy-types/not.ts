import Policy from "../../chip-types/policy";
import * as Query from "../../datastore/query";
import { CollectionItem, Context } from "../../main";

export default class Not extends Policy {
	static type_name = "not";
	strategy_to_negate: Policy;
	constructor(strategy: Policy) {
		super(strategy);
		this.strategy_to_negate = Policy.fromDefinition(strategy);
	}

	async _getRestrictingQuery(context: Context) {
		//assuming "not" can take only one access strategy as a parameter
		const query = await this.strategy_to_negate.getRestrictingQuery(
			context
		);
		return new Query.Not(query);
	}
	async isItemSensitive(context: Context) {
		return this.strategy_to_negate.isItemSensitive(context);
	}
	async checkerFunction(
		context: Context,
		item_getter: () => Promise<CollectionItem>
	) {
		const result = await this.strategy_to_negate.check(
			context,
			item_getter
		);
		if (result === null) {
			return null;
		}
		if (result.allowed) {
			return Policy.deny(
				context.app.i18n("policy_not_allow", [result.reason])
			);
		}
		return Policy.allow(`it's not true that "${result.reason}"`);
	}
}
