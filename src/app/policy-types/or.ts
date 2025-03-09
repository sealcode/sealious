import Bluebird from "bluebird";
import Policy, {
	ReducingPolicy,
	type PolicyDecision,
} from "../../chip-types/policy.js";

import type Context from "../../context.js";

import { AllowAll } from "../../datastore/allow-all.js";
import { default as QueryOr } from "../../datastore/query-or.js";
import type { CollectionItem } from "../../main.js";

export default class Or extends ReducingPolicy {
	static type_name = "or";
	async _getRestrictingQuery(context: Context) {
		const queries = await Bluebird.map(this.policies, (strategy) =>
			strategy.getRestrictingQuery(context)
		);
		if (queries.some((query) => query instanceof AllowAll)) {
			return new AllowAll();
		}
		return new QueryOr(...queries);
	}

	async isItemSensitive(context: Context) {
		return (
			await Promise.all(
				this.policies.map((policy) => policy.isItemSensitive(context))
			)
		).some((e) => e);
	}

	async checkerFunction(
		context: Context,
		item_getter: () => Promise<CollectionItem>
	) {
		const results = await this.checkAllPolicies(context, item_getter);
		const positives: Exclude<PolicyDecision, null>[] = results.filter(
			(result) => result?.allowed === true
		) as Exclude<PolicyDecision, null>[];
		if (positives.length === 0) {
			return Policy.deny(results.map((r) => `"${r?.reason}"`).join(", "));
		}
		return Policy.allow(positives[0].reason);
	}
}
