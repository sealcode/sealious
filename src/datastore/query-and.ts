import { Query, SQLPreparedStatement } from "./query-base.js";
import QueryStep, { Match } from "./query-step.js";
import Graph from "./graph.js";
import { QueryTypes } from "../main.js";
import type QueryStage from "./query-stage.js";

export default class And extends Query {
	graph: Graph;
	aggregation_steps: { [id: string]: QueryStep };
	received_deny_all: boolean;
	queries: Query[];
	constructor(...queries: Query[]) {
		super();
		this.queries = queries;
		this._reset();
		for (let query of queries) {
			this.addQuery(query);
		}
	}
	_reset() {
		this.graph = new Graph();
		this.aggregation_steps = {};
		this.received_deny_all = false;
	}
	addQuery(query: Query) {
		if (this.received_deny_all) {
			return;
		}
		if (query instanceof QueryTypes.DenyAll) {
			this._reset();
			this.received_deny_all = true;
		}
		const steps = query.dump();
		for (let step of steps) {
			const id = step.hash();
			if (this._isInGraph(id)) {
				continue;
			}

			this._addToAggregationSteps(id, step);
			this._addDependenciesInGraph(id, step);
		}
	}
	_isInGraph(key: string) {
		return key.length === 32 && this.graph.node_ids.includes(key);
	}

	_addToAggregationSteps(id: string, step: QueryStep) {
		this.graph.addNode(id, step.getCost());
		this.aggregation_steps[id] = step;
	}

	_addDependenciesInGraph(id: string, step: QueryStep) {
		let dependencies = step
			.getUsedFields()
			.filter((field) => this._isInGraph(field));

		if (step instanceof Match) {
			dependencies = dependencies.filter((d1) =>
				this._isNotDependencyForAnyInGroup(d1, dependencies)
			);
		}

		for (let dependency of dependencies) {
			this.graph.addEdge(dependency, id);
		}
	}

	_isNotDependencyForAnyInGroup(id: string, nodeGroup: string[]) {
		return !nodeGroup.some(
			(node) => id !== node && this.graph.pathExists(id, node)
		);
	}

	dump() {
		const sortedStepIds = this.graph.bestFirstSearch();
		return sortedStepIds.reduce((steps, id) => {
			steps.push(this.aggregation_steps[id]);
			return steps;
		}, [] as QueryStep[]);
	}

	toPipeline(): QueryStage[] {
		const sortedStepIds = this.graph.bestFirstSearch();
		const ret = sortedStepIds.reduce((pipeline: QueryStage[], id) => {
			return [...pipeline, ...this.aggregation_steps[id].toPipeline()];
		}, [] as QueryStage[]);
		return ret;
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
			where: `(${sqlExpressions.join(" AND ")})`.replace(
				/\$[0-9]+/g,
				() => `$${++counter}`
			),
			join: sqlJoins,
			parameters,
		};
	}
}
