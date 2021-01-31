import Bluebird from "bluebird";
import { And as AndQuery } from "../../datastore/query";
import { Context, CollectionItem } from "../../main";
import Policy, { ReducingPolicy } from "../../chip-types/policy";

export default class And extends ReducingPolicy {
	static type_name = "and";
	async _getRestrictingQuery(context: Context) {
		const queries = await Bluebird.map(this.policies, (strategy) =>
			strategy.getRestrictingQuery(context)
		);

		const ret = new AndQuery(...queries);
		return ret;
	}

	isItemSensitive(context: Context) {
		return Bluebird.map(this.policies, (strategy) =>
			strategy.isItemSensitive(context)
		).reduce((a, b) => a || b);
	}

	async checkerFunction(
		context: Context,
		item_getter: () => Promise<CollectionItem>
	) {
		const results = await this.checkAllPolicies(context, item_getter);
		const negatives = results.filter((result) => result?.allowed === false);
		if (negatives.length > 0) {
			return Policy.deny(`${negatives.map((n) => n?.reason).join(", ")}`);
		}
		return Policy.allow(
			`${results
				.filter((r) => r !== null)
				.map((r) => r?.reason)
				.join(", ")}`
		);
	}
}
