import { And as AndQuery } from "../../datastore/query.js";
import type { Context, CollectionItem } from "../../main.js";
import Policy, { ReducingPolicy } from "../../chip-types/policy.js";

export default class And extends ReducingPolicy {
	static type_name = "and";
	async _getRestrictingQuery(context: Context) {
		const queries = await Promise.all(
			this.policies.map((strategy) =>
				strategy.getRestrictingQuery(context)
			)
		);

		const ret = new AndQuery(...queries);
		return ret;
	}

	async isItemSensitive(context: Context) {
		const results = await Promise.all(
			this.policies.map((strategy) => strategy.isItemSensitive(context))
		);
		return results.reduce((a, b) => a || b, false);
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
