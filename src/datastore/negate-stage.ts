import type { MatchBody } from "./query-stage.js";

export default function negate_match(stage: MatchBody) {
	const negated_stage: MatchBody = {};
	for (const key in stage) {
		if (key === "$or") {
			negated_stage.$nor = stage.$or;
		} else if (key === "$nor") {
			negated_stage.$or = stage.$nor;
		} else if (key === "$and") {
			negated_stage.$or = stage.$and?.map((expression: MatchBody) =>
				negate_match(expression)
			);
		} else {
			if ((stage[key] as MatchBody).$not) {
				negated_stage[key] = (stage[key] as MatchBody)
					.$not as MatchBody;
			} else if (typeof stage[key] == "boolean") {
				negated_stage[key] = !stage[key];
			} else if (typeof stage[key] !== "object") {
				negated_stage[key] = { $not: { $eq: stage[key] } };
			} else {
				negated_stage[key] = { $not: stage[key] };
			}
		}
	}
	return negated_stage;
}
