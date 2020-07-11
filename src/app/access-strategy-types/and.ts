import Bluebird from "bluebird";
import { And as AndQuery } from "../../datastore/query";
import { Context } from "../../main";
import SealiousResponse from "../../../common_lib/response/sealious-response";
import AccessStrategy, {
	ReducingAccessStrategy,
} from "../../chip-types/access-strategy";

export default class And extends ReducingAccessStrategy {
	static type_name = "and";
	async _getRestrictingQuery(context: Context) {
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
				`${negatives.map((n) => n?.reason).join(", ")}`
			);
		}
		return AccessStrategy.allow(
			`${results
				.filter((r) => r !== null)
				.map((r) => r?.reason)
				.join(", ")}`
		);
	}
}
