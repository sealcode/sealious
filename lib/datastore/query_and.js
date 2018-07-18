const Query = require("./query.js");
const QueryStep = require("./query-step.js");
const Graph = require("./graph.js");

module.exports = class extends Query {
	constructor(...queries) {
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
	addQuery(query) {
		if (this.received_deny_all) {
			return;
		}
		if (query instanceof Query.DenyAll) {
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
	_isInGraph(key) {
		return key.length === 32 && this.graph.node_ids.includes(key);
	}
	_addToAggregationSteps(id, step) {
		this.graph.addNode(id, step.getCost());
		this.aggregation_steps[id] = step;
	}
	_addDependenciesInGraph(id, step) {
		let dependencies = step
			.getUsedFields()
			.filter(field => this._isInGraph(field));

		if (step instanceof QueryStep.Match) {
			dependencies = dependencies.filter(d1 =>
				this._isNotDependencyForAnyInGroup(d1, dependencies)
			);
		}

		for (let dependency of dependencies) {
			this.graph.addEdge(dependency, id);
		}
	}
	_isNotDependencyForAnyInGroup(id, nodeGroup) {
		return !nodeGroup.some(
			node => id !== node && this.graph.pathExists(id, node)
		);
	}
	dump() {
		const sortedStepIds = this.graph.bestFirstSearch();
		return sortedStepIds.reduce((steps, id) => {
			if (Array.isArray(this.aggregation_steps[id])) {
				steps.push(...this.aggregation_steps[id]);
			} else {
				steps.push(this.aggregation_steps[id]);
			}
			return steps;
		}, []);
	}
	toPipeline() {
		const sortedStepIds = this.graph.bestFirstSearch();
		return sortedStepIds.reduce((pipeline, id) => {
			if (Array.isArray(this.aggregation_steps[id])) {
				for (let step of this.aggregation_steps[id]) {
					step.pushStage(pipeline);
				}
				return pipeline;
			}
			return this.aggregation_steps[id].pushStage(pipeline);
		}, []);
	}
};
