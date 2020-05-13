import Query from "./query.js";
import QueryStep from "./query-step.js";

export default class Or extends Query {
	constructor(...queries) {
		super();
		this.lookup_steps = [];
		for (let query of queries) {
			this.addQuery(query);
		}
	}
	addQuery(query) {
		const steps = query.dump();
		this.lookup_steps.push(
			...steps.filter((step) => step instanceof QueryStep.Lookup)
		);
		const match_stage_bodies = [];
		steps
			.filter((step) => step instanceof QueryStep.Match)
			.forEach((step) => step.pushDump(match_stage_bodies));

		const match_stage =
			match_stage_bodies.length > 1
				? { $and: match_stage_bodies }
				: match_stage_bodies[0];
		this.steps.push(new QueryStep.Match(match_stage));
	}
	dump() {
		return this.lookup_steps.concat(
			new QueryStep.Match({ $or: this._getMatchExpressions() })
		);
	}
	toPipeline() {
		const lookups = this.lookup_steps.reduce(
			(acc, step) => step.pushStage(acc),
			[]
		);

		return lookups.concat({ $match: { $or: this._getMatchExpressions() } });
	}
	_getMatchExpressions() {
		return this.steps.reduce((acc, step) => step.pushDump(acc), []);
	}
}
