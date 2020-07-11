import { AccessStrategy, Query, AccessStrategyClass } from "../../main";

export default {
	allowDeny: function (): AccessStrategyClass[] {
		const access_strategies = [
			"complex-deny-pipeline",
			"complex-allow-pipeline",
		];
		const ret: AccessStrategyClass[] = [];
		for (const strategy_name of access_strategies) {
			ret.push(
				class extends AccessStrategy {
					async _getRestrictingQuery() {
						const query = new Query();
						const id = query.lookup({
							from: "numbers",
							localField: "number",
							foreignField: "sealious_id",
						});
						query.match({
							[`${id}._id`]: {
								$exists:
									strategy_name === "complex-allow-pipeline",
							},
						});
						return query;
					}
					async checkerFunction() {
						return AccessStrategy.allow(
							"I don't care about individual items, my goal is to test the filtering pipelines"
						);
					}
					item_sensitive: true;
				}
			);
		}
		return ret;
	},
};
