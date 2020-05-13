import Query from "./query.js";

export default class Not extends Query {
	constructor(query) {
		super();
		this.addQuery(query);
	}
	addQuery(query) {
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
