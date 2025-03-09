import { Policy, Query, type PolicyClass } from "../../main.js";

export default {
	allowDeny: function (): PolicyClass[] {
		const policies = ["complex-deny-pipeline", "complex-allow-pipeline"];
		const ret: PolicyClass[] = [];
		for (const strategy_name of policies) {
			ret.push(
				class extends Policy {
					async _getRestrictingQuery() {
						const query = new Query();
						const id = query.lookup({
							from: "numbers",
							localField: "number",
							foreignField: "id",
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
						return Policy.allow(
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
