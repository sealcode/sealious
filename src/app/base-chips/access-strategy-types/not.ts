import AccessStrategy, {
	AccessStrategyDefinition,
} from "../../../chip-types/access-strategy.js";
import * as Query from "./../../../datastore/query.js";
import { Context, App } from "../../../main.js";
import SealiousResponse from "../../../../common_lib/response/sealious-response.js";

export default class Not extends AccessStrategy {
	strategy_to_negate: AccessStrategy;
	constructor(app: App, strategy: AccessStrategyDefinition) {
		super(app, strategy);
		this.strategy_to_negate = AccessStrategy.fromDefinition(app, strategy);
	}

	async getRestrictingQuery(context: Context) {
		//assuming "not" can take only one access strategy as a parameter
		const query = await this.strategy_to_negate.getRestrictingQuery(
			context
		);
		return new Query.Not(query);
	}
	async isItemSensitive() {
		return this.strategy_to_negate.isItemSensitive();
	}
	async checkerFunction(
		context: Context,
		sealious_response: SealiousResponse
	) {
		const result = await this.strategy_to_negate.check(
			context,
			sealious_response
		);
		if (result === null) {
			return null;
		}
		if (result.allowed) {
			return AccessStrategy.deny(result.reason);
		}
		return AccessStrategy.allow(`it's not true that "${result.reason}"`);
	}
}
