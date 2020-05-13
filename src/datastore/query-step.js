const object_hash = require("object-hash");
const negate_stage = require("./negate_stage.js");

export default class QueryStep {
	constructor(body) {
		this.body = body;
	}
	hash() {
		return QueryStep.hashBody(this.body);
	}
	static fromStage(stage, unwind = true) {
		if (stage.$lookup) {
			const clonedStageBody = Object.assign({}, stage.$lookup);
			clonedStageBody.unwind = unwind;
			return [new QueryStep.Lookup(clonedStageBody)];
		} else if (stage.$match) {
			return Object.keys(stage.$match).map(
				(field) => new QueryStep.Match({ [field]: stage.$match[field] })
			);
		}
		throw new Error("Unsupported stage: " + JSON.stringify(stage));
	}
	pushDump(dumps) {
		dumps.push(this.body);
		return dumps;
	}
	static hashBody(body) {
		return object_hash(body, {
			algorithm: "md5",
			excludeKeys: (key) => key === "as",
		});
	}
	getUsedFields() {
		throw new Error("Cannot be used on base QueryStep class");
	}
}

QueryStep.Lookup = class extends QueryStep {
	constructor(body) {
		const cleared_body = {
			from: body.from,
			localField: body.localField,
			foreignField: body.foreignField,
		};
		cleared_body.as = QueryStep.hashBody(cleared_body);
		super(cleared_body);
		this.unwind = body.unwind;
	}
	hash() {
		return this.body.as;
	}
	pushStage(pipeline) {
		pipeline.push({ $lookup: this.body });
		if (this.unwind) {
			pipeline.push({ $unwind: "$" + this.body.as });
		}
		return pipeline;
	}
	getUsedFields() {
		return this.body.localField.split(".");
	}
	getCost() {
		return 8;
	}
	negate() {
		return this;
	}
};

QueryStep.Match = class extends QueryStep {
	pushStage(pipeline) {
		pipeline.push({ $match: this.body });
		return pipeline;
	}
	getUsedFields() {
		return getAllKeys(this.body)
			.map((path) => path.split("."))
			.reduce((acc, fields) =>
				acc.concat(fields.filter((field) => !field.startsWith("$")))
			);
	}
	getCost() {
		return this.body.$or ? 2 : 0;
	}
	negate() {
		return new QueryStep.Match(negate_stage(this.body));
	}
};

function getAllKeys(obj) {
	return Object.keys(obj).reduce((acc, key) => {
		if (obj[key] instanceof Object) {
			acc.push(...getAllKeys(obj[key]));
		}
		if (!Array.isArray(obj)) {
			acc.push(key);
		}
		return acc;
	}, []);
}
