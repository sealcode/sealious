import Query from "./query";

export default class Not extends Query {
	constructor(query: Query) {
		super();
		this.addQuery(query);
	}
	addQuery(query: Query) {
		const steps = query.dump();
		this.steps.push(...steps);
	}
	dump() {
		return this.steps.map((step) => step.negate());
	}
	toPipeline() {
		return this.steps.reduce(
			(acc, step) => step.negate().pushStage(acc),
			[]
		);
	}
}
