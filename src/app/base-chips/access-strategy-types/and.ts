import Bluebird from "bluebird";
import { And as AndQuery } from "../../../datastore/query.js";
import { Context } from "../../../main.js";
import SealiousResponse from "../../../../common_lib/response/sealious-response.js";
import AccessStrategy, {
	ReducingAccessStrategy,
} from "../../../chip-types/access-strategy.js";

export default class And extends ReducingAccessStrategy {
	async getRestrictingQuery(context: Context) {
		const queries = await Bluebird.map(this.access_strategies, (strategy) =>
			strategy.getRestrictingQuery(context)
		);
		return new AndQuery(...queries);
	}

	isItemSensitive() {
		return Bluebird.map(this.access_strategies, (strategy) =>
			strategy.isItemSensitive()
		).reduce((a, b) => a || b);
	}

	async checkerFunction(context: Context, response: SealiousResponse) {
		const results = await this.checkAllStrategies(context, response);
		const negatives = results.filter((result) => result?.allowed === false);
		if (negatives.length > 0) {
			return AccessStrategy.deny(
				`conditions: ${negatives
					.map((n) => `"${n?.reason}"`)
					.join(", ")} are not met`
			);
		}
		return AccessStrategy.allow(
			`conditions: ${results
				.filter((r) => r !== null)
				.map((r) => `"${r?.reason}"`)
				.join(", ")} are all met`
		);
	}
}
