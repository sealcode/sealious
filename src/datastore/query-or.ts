import Query from "./query";
import QueryStep, { Lookup, Match } from "./query-step";

export default class Or extends Query {
	lookup_steps: QueryStep[];
	constructor(...queries: Query[]) {
		super();
		this.lookup_steps = [];
		for (let query of queries) {
			this.addQuery(query);
		}
	}

	addQuery(query: Query) {
		const steps = query.dump();
		this.lookup_steps.push(
			...(steps.filter((step) => step instanceof Lookup) as Lookup[])
		);
		const match_stage_bodies: Query[] = [];
		steps
			.filter((step) => step instanceof Match)
			.forEach((step) => step.pushDump(match_stage_bodies));

		const match_stage =
			match_stage_bodies.length > 1
				? { $and: match_stage_bodies }
				: match_stage_bodies[0];
		this.steps.push(new Match(match_stage));
	}

	dump() {
		return this.lookup_steps.concat(
			new Match({ $or: this._getMatchExpressions() })
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
