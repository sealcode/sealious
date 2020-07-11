import QueryStage from "./query-stage";

export default function negate_stage(stage: QueryStage) {
	const negated_stage: QueryStage = {};
	for (let key of Object.keys(stage) as (keyof typeof stage)[]) {
		if (key === "$or") {
			negated_stage.$nor = stage[key];
		} else if (key === "$nor") {
			negated_stage.$or = stage[key];
		} else if (key === "$and") {
			negated_stage.$or = stage[key]?.map((expression: QueryStage) =>
				negate_stage(expression)
			);
		} else {
			if (stage[key].$not) {
				negated_stage[key] = stage[key].$not;
			} else {
				negated_stage[key] = { $not: stage[key] };
			}
		}
	}
	return negated_stage;
}
