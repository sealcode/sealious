import Query from "./query";
import QueryStep, { Match } from "./query-step";
import Graph from "./graph";
import { QueryTypes } from "../main";

export default class And extends Query {
	graph: Graph;
	aggregation_steps: { [id: string]: QueryStep | QueryStep[] };
	received_deny_all: boolean;
	constructor(...queries: Query[]) {
		super();
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
			if (Array.isArray(this.aggregation_steps[id])) {
				steps.push(...(this.aggregation_steps[id] as QueryStep[]));
			} else {
				steps.push(this.aggregation_steps[id] as QueryStep);
			}
			return steps;
		}, [] as QueryStep[]);
	}
	toPipeline() {
		const sortedStepIds = this.graph.bestFirstSearch();
		const ret = sortedStepIds.reduce((pipeline, id) => {
			if (Array.isArray(this.aggregation_steps[id])) {
				for (let step of this.aggregation_steps[id] as QueryStep[]) {
					step.pushStage(pipeline);
				}
				return pipeline;
			}
			return (this.aggregation_steps[id] as QueryStep).pushStage(
				pipeline
			);
		}, []);
		return ret;
	}
}
