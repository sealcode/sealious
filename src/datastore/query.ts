import {
	Lookup,
	Match,
	default as QueryStep,
	ComplexLookupBodyInput,
	SimpleLookupBodyInput,
	LookupBody,
} from "./query-step";
import transformObject from "../utils/transform-object";
import QueryStage from "./query-stage";

export default class Query {
	steps: QueryStep[];
	body: any;
	constructor() {
		this.steps = [];
	}

	lookup(body: SimpleLookupBodyInput | ComplexLookupBodyInput) {
		const lookup_step = Lookup.fromBody(body);
		this.steps.push(lookup_step);
		return lookup_step.hash();
	}

	match(body: { [key: string]: unknown }) {
		for (const key in body) {
			this.steps.push(new Match({ [key]: body[key] }));
		}
	}

	dump() {
		return this.steps;
	}

	toPipeline(): QueryStage[] {
		return this.steps
			.map((step) => step.toPipeline())
			.reduce((acc, cur) => acc.concat(cur), []);
	}

	static fromSingleMatch(body: any) {
		const query = new Query();
		query.match(body);
		return query;
	}

	static fromCustomPipeline(stages: QueryStage[], rehash = false) {
		const ret = new Query();
		let steps;
		const lookup_field_to_hash: { [field_as: string]: string } = {};
		for (const stage of stages) {
			const query_steps = QueryStep.fromStage(stage, false, rehash);
			for (const [old_name, new_name] of Object.entries(
				lookup_field_to_hash
			)) {
				query_steps.forEach((step) =>
					step.renameField(old_name, new_name)
				);
			}
			for (const query_step of query_steps) {
				if (query_step instanceof Lookup) {
					lookup_field_to_hash[stage?.$lookup?.as as string] =
						query_step.body.as;
				}
			}
			ret.steps.push(...query_steps);
		}
		return ret;
	}

	_isUnwindStage(stages: QueryStage[], i: number) {
		if (!stages[i].$lookup) {
			return false;
		}
		return (stages[i + 1]?.$unwind && true) || false;
	}

	prefix(prefix: string): Query {
		this.steps = this.steps.map((step) => step.prefix(prefix));
		return this;
	}
}

export { default as Or } from "./query-or";

export { default as And } from "./query-and";
export { default as Not } from "./query-not";
export { default as QueryStage } from "./query-stage";
