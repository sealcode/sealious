import Bluebird from "bluebird";
import AccessStrategy, {
	ReducingAccessStrategy,
	AccessStrategyDecision,
} from "../../chip-types/access-strategy";

import Context from "../../context";

import SealiousResponse from "../../../common_lib/response/sealious-response";
import { AllowAll } from "../../datastore/allow-all";
import { default as QueryOr } from "../../datastore/query-or";

export default class Or extends ReducingAccessStrategy {
	static type_name = "or";
	async _getRestrictingQuery(context: Context) {
		const queries = await Bluebird.map(this.access_strategies, (strategy) =>
			strategy.getRestrictingQuery(context)
		);
		if (queries.some((query) => query instanceof AllowAll)) {
			return new AllowAll();
		}
		return new QueryOr(...queries);
	}
	async isItemSensitive() {
		return Bluebird.map(this.access_strategies, (strategy) =>
			strategy.isItemSensitive()
		).reduce((a, b) => a || b, true);
	}
	async checkerFunction(context: Context, response: SealiousResponse) {
		const results = await this.checkAllStrategies(context, response);
		const positives: Exclude<
			AccessStrategyDecision,
			null
		>[] = results.filter((result) => result?.allowed === true) as Exclude<
			AccessStrategyDecision,
			null
		>[];
		if (positives.length === 0) {
			return AccessStrategy.deny(
				results.map((r) => `"${r?.reason}"`).join(", ")
			);
		}
		return AccessStrategy.allow(positives[0].reason);
	}
}
