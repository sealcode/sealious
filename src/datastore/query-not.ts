import Query, { QueryStage } from "./query";
import QueryStep from "./query-step";

export default class Not extends Query {
	constructor(query: Query) {
		super();
		this.addQuery(query);
	}

	addQuery(query: Query): void {
		const steps = query.dump();
		this.steps.push(...steps);
	}

	dump(): QueryStep[] {
		return this.steps.map((step) => step.negate());
	}

	toPipeline(): QueryStage[] {
		return this.dump()
			.map((step) => step.toPipeline())
			.reduce((acc, cur) => [...acc, ...cur], []);
	}
}
