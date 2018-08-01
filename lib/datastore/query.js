"use strict";

const object_hash = require("object-hash");
const QueryStep = require("./query-step.js");
const transformObject = require("../utils/transform-object.js");

class Query {
	constructor() {
		this.steps = [];
	}
	lookup(body) {
		const lookup_step = new QueryStep.Lookup(body);
		this.steps.push(lookup_step);
		return lookup_step.hash();
	}
	match(body) {
		for (let key of Object.keys(body)) {
			this.steps.push(new QueryStep.Match({ [key]: body[key] }));
		}
	}
	dump() {
		return this.steps;
	}
	toPipeline() {
		return this.steps.reduce(
			(pipeline, query_step) => query_step.pushStage(pipeline),
			[]
		);
	}
	static fromSingleMatch(body) {
		const query = new Query();
		query.match(body);
		return query;
	}
	static fromCustomPipeline(stages) {
		const query = new Query();
		let steps;
		const field_as_to_hash = {};
		for (let i = 0; i < stages.length; ++i) {
			if (stages[i].$unwind) {
				continue;
			}
			const stage = transformObject(
				stages[i],
				prop => {
					if (prop.startsWith("$")) {
						return prop;
					}
					const fields = prop.split(".");
					return fields
						.map(field => field_as_to_hash[field] || field)
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
						.map(field => field_as_to_hash[field] || field)
						.join(".");
				}
			);
			steps = QueryStep.fromStage(stage, query._isUnwindStage(stages, i));
			if (stage.$lookup) {
				const field_as = stage.$lookup.as;
				field_as_to_hash[field_as] = steps[0].hash();
			}

			query.steps.push(...steps);
		}
		return query;
	}
	_isUnwindStage(stages, i) {
		if (!stages[i].$lookup) {
			return false;
		}
		return stages[i + 1] && stages[i + 1].$unwind;
	}
}

module.exports = Query;

Query.DenyAll = class extends Query {
	constructor() {
		super();
		super.match({ _id: { $exists: false } });
	}
	lookup() {
		throw new Error("The query is not mutable!");
	}
	match() {
		throw new Error("The query is not mutable!");
	}
};

Query.AllowAll = class extends Query {
	constructor() {
		super();
		super.match({ _id: { $exists: true } });
	}
	lookup() {
		throw new Error("The query is not mutable!");
	}
	match() {
		throw new Error("The query is not mutable!");
	}
};

Query.Or = require("./query_or.js");

Query.And = require("./query_and.js");

Query.Not = require("./query_not.js");
