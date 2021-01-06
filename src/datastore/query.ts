import { Lookup, Match, default as QueryStep, LookupBody } from "./query-step";
import transformObject from "../utils/transform-object";
import QueryStage from "./query-stage";

export default class Query {
	steps: QueryStep[];
	body: any;
	constructor() {
		this.steps = [];
	}

	lookup(body: LookupBody) {
		const lookup_step = new Lookup(body);
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
		return this.steps.reduce(
			(pipeline, query_step) => query_step.pushStage(pipeline),
			[]
		);
	}
	static fromSingleMatch(body: any) {
		const query = new Query();
		query.match(body);
		return query;
	}
	static fromCustomPipeline(stages: QueryStage[]) {
		const query = new Query();
		let steps;
		const field_as_to_hash: { [field_as: string]: string } = {};
		for (let i = 0; i < stages.length; ++i) {
			if (stages[i].$unwind) {
				continue;
			}
			const stage = transformObject(
				stages[i] as Record<string, unknown>,
				(prop) => {
					if (prop.startsWith("$")) {
						return prop;
					}
					const fields = prop.split(".");
					return fields
						.map((field) => field_as_to_hash[field] || field)
						.join(".");
				},
				(prop, value) => {
					let fields;
					if (typeof value !== "string") {
						return value;
					}
					if (prop === "localField") {
						fields = value.split(".");
					} else if (value.startsWith("$")) {
						fields = value.substring(1).split(".");
					} else {
						return value;
					}
					return fields
						.map((field) => field_as_to_hash[field] || field)
						.join(".");
				}
			) as QueryStage;
			steps = QueryStep.fromStage(stage, query._isUnwindStage(stages, i));
			if (stage.$lookup) {
				if (typeof stage.$lookup.as !== "string") {
					throw new Error("Wrong lookup value");
				}
				const field_as = stage.$lookup.as as string;
				field_as_to_hash[field_as] = steps[0].hash();
			}

			query.steps.push(...steps);
		}
		return query;
	}
	_isUnwindStage(stages: QueryStage[], i: number) {
		if (!stages[i].$lookup) {
			return false;
		}
		return (stages[i + 1]?.$unwind && true) || false;
	}
}

export { default as Or } from "./query-or";

export { default as And } from "./query-and";
export { default as Not } from "./query-not";
export { default as QueryStage } from "./query-stage";
