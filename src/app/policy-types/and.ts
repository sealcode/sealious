import Bluebird from "bluebird";
import { And as AndQuery } from "../../datastore/query";
import { Context } from "../../main";
import SealiousResponse from "../../../common_lib/response/sealious-response";
import Policy, { ReducingPolicy } from "../../chip-types/policy";

export default class And extends ReducingPolicy {
	static type_name = "and";
	async _getRestrictingQuery(context: Context) {
		const queries = await Bluebird.map(this.policies, (strategy) =>
			strategy.getRestrictingQuery(context)
		);
		return new AndQuery(...queries);
	}

	isItemSensitive() {
		return Bluebird.map(this.policies, (strategy) =>
			strategy.isItemSensitive()
		).reduce((a, b) => a || b);
	}

	async checkerFunction(context: Context, response: SealiousResponse) {
		const results = await this.checkAllPolicies(context, response);
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
