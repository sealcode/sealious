import Query from "./query.js";
import type { QueryStage } from "./query-stage.js";
import type { MatchBody } from "./query-stage.js";
import QueryStep, { Lookup, Match } from "./query-step.js";
import type { SQLPreparedStatement } from "./query-base.js";

export default class Or extends Query {
	lookup_steps: QueryStep[] = [];
	queries: Query[];
	constructor(...queries: Query[]) {
		super();
		this.queries = queries;
		for (const query of queries) {
			this.addQuery(query);
		}
	}

	addQuery(query: Query): void {
		const steps = query.dump();
		this.lookup_steps.push(
			...(steps.filter((step) => step instanceof Lookup) as Lookup[])
		);
		const match_stage_bodies = steps
			.filter((step) => step instanceof Match)
			.map((match: Match) => match.body);

		if (match_stage_bodies.length) {
			const match_stage: MatchBody =
				match_stage_bodies.length > 1
					? { $and: match_stage_bodies }
					: match_stage_bodies[0];
			this.steps.push(new Match(match_stage));
		}
	}

	dump(): QueryStep[] {
		return this.lookup_steps.concat(
			new Match({ $or: this._getMatchExpressions() })
		);
	}

	toPipeline(): QueryStage[] {
		const lookups = this.lookup_steps
			.map((step) => step.toPipeline())
			.reduce((acc, cur) => acc.concat(cur), []);
		return lookups.concat({ $match: { $or: this._getMatchExpressions() } });
	}

	toPreparedStatement(): SQLPreparedStatement {
		const compiledStatements = this.queries.map((query) =>
			query.toPreparedStatement()
		);
		const parameters = compiledStatements.flatMap(
			(statement) => statement.parameters
		);
		const sqlExpressions = compiledStatements.map(
			(statement) => statement.where
		);
		const sqlJoins = compiledStatements.flatMap(
			(statement) => statement.join
		);
		let counter = 0;

		return {
			where: `(${sqlExpressions.join(" OR ")})`.replace(
				/\$[0-9]+/g,
				() => `$${++counter}`
			),
			join: sqlJoins,
			parameters,
		};
	}

	_getMatchExpressions(): MatchBody[] {
		return this.steps
			.filter((step) => step instanceof Match)
			.map((step) => step.body as MatchBody);
	}

	prefix(prefix: string): this {
		super.prefix(prefix);
		this.lookup_steps = this.lookup_steps.map((step) =>
			step.prefix(prefix)
		);
		return this;
	}
}
