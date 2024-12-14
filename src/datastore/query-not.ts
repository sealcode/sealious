import Query, { QueryStage } from "./query.js";
import type QueryStep from "./query-step.js";
import type { SQLPreparedStatement } from "./query-base.js";

export default class Not extends Query {
	query: Query;
	constructor(query: Query) {
		super();
		this.query = query;
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

	toPreparedStatement(): SQLPreparedStatement {
		const queryPreparedStatment = this.query.toPreparedStatement();
		return {
			...queryPreparedStatment,
			where: queryPreparedStatment.where
				? `(NOT ${queryPreparedStatment.where})`
				: "",
		};
	}
}
