import object_hash from "object-hash";
import Query from "./query";
import negate_stage from "./negate-stage";
import QueryStage from "./query-stage";

export default abstract class QueryStep {
	body: any;
	hash() {
		return QueryStep.hashBody(this.body);
	}
	static fromStage(stage: QueryStage, unwind = true) {
		if (stage.$lookup) {
			const clonedStageBody = Object.assign({}, stage.$lookup);
			clonedStageBody.unwind = unwind;
			return [new Lookup(clonedStageBody)];
		} else if (stage.$match) {
			return Object.keys(stage.$match).map(
				(field) => new Match({ [field]: stage.$match[field] })
			);
		}
		throw new Error("Unsupported stage: " + JSON.stringify(stage));
	}
	pushDump(dumps: Query[]) {
		dumps.push(this.body);
		return dumps;
	}
	static hashBody(body: any) {
		return object_hash(body, {
			algorithm: "md5",
			excludeKeys: (key) => key === "as",
		});
	}

	abstract getUsedFields(): string[];

	abstract getCost(): number;
	abstract pushStage(pipeline: any[]): any[];
	abstract negate(): QueryStep;
}

export type LookupBody = {
	from: string;
	localField: string;
	foreignField: string;
	as?: string;
	unwind?: boolean;
};

export class Lookup extends QueryStep {
	unwind: boolean;
	body: LookupBody;
	constructor(body: LookupBody) {
		super();
		const cleared_body: LookupBody = {
			from: body.from,
			localField: body.localField,
			foreignField: body.foreignField,
			as: "temp", //overwritten below, included for type safety
		};
		cleared_body.as = QueryStep.hashBody(cleared_body);
		this.body = cleared_body;
		this.unwind = body.unwind || false;
	}
	hash() {
		if (!this.body.as) {
			throw new Error(
				"Cannot hash a lookup step without an `as` property"
			);
		}
		return this.body.as;
	}
	pushStage(pipeline: any[]) {
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
}

export class Match extends QueryStep {
	constructor(body: any) {
		super();
		this.body = body;
	}
	pushStage(pipeline: any[]) {
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
		return new Match(negate_stage(this.body));
	}
}

function getAllKeys(obj: any): string[] {
	return Object.keys(obj).reduce((acc, key) => {
		if (obj[key] instanceof Object) {
			acc.push(...getAllKeys(obj[key]));
		}
		if (!Array.isArray(obj)) {
			acc.push(key);
		}
		return acc;
	}, [] as string[]);
}
