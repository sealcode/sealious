import AccessStrategy, {
	ReducingAccessStrategy,
	AccessStrategyDecision,
} from "../../../chip-types/access-strategy.js";

const Error = require("../../../response/error.js").Error;
import Context from "../../../context.js";
import Bluebird from "bluebird";
import SealiousResponse from "../../../../common_lib/response/sealious-response.js";
const Query = require("../../../datastore/query.js").default;

export default class Or extends ReducingAccessStrategy {
	async getRestrictingQuery(context: Context) {
		const queries = await Bluebird.map(this.access_strategies, (strategy) =>
			strategy.getRestrictingQuery(context)
		);
		if (queries.some((query) => query instanceof Query.AllowAll)) {
			return new Query.AllowAll();
		}
		return new Query.Or(...queries);
	}
	async isItemSensitive() {
		return Bluebird.map(this.access_strategies, (strategy) =>
			strategy.isItemSensitive()
		).reduce((a, b) => a || b, true);
	}
	async checkerFunction(context: Context, response: SealiousResponse) {
		const results = await this.checkAllStrategies(context, response);
		const positives: AccessStrategyDecision[] = results.filter(
			(result) => result?.allowed === true
		);
		if (positives.length === 0) {
			return AccessStrategy.deny(
				results.map((r) => `"${r?.reason}"`).join(", ")
			);
		}
		return AccessStrategy.allow(positives[0].reason);
	}
}
