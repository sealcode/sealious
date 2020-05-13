function negate_stage(stage) {
	const negated_stage = {};
	for (let key of Object.keys(stage)) {
		if (key === "$or") {
			negated_stage.$nor = stage[key];
		} else if (key === "$nor") {
			negated_stage.$or = stage[key];
		} else if (key === "$and") {
			negated_stage.$or = stage[key].map(expression =>
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

module.exports = negate_stage;
