import object_hash from "object-hash";
import transformObject from "../utils/transform-object.js";
import negate_stage from "./negate-stage.js";
import type { QueryStage } from "./query-stage.js";
import type { MatchBody } from "./query-stage.js";
import type { SQLPreparedStatement } from "./query-base.js";

export default abstract class QueryStep {
	body: any;
	hash(): string {
		return QueryStep.hashBody(this.body);
	}

	static fromStage(
		stage: QueryStage,
		unwind = true,
		rehash = false
	): QueryStep[] {
		if (stage.$lookup) {
			const clonedStageBody = { ...stage.$lookup };
			clonedStageBody.unwind = unwind;
			return [Lookup.fromBody(clonedStageBody, rehash)];
		} else if (stage.$match) {
			return Object.keys(stage.$match).map(
				(field) => new Match({ [field]: stage?.$match?.[field] })
			);
		} else if (stage.$group) {
			return [new Group(stage.$group)];
		} else if (stage.$unwind) {
			return [new Unwind(stage.$unwind)];
		}
		throw new Error("Unsupported stage: " + JSON.stringify(stage));
	}

	static hashBody(body: any) {
		return object_hash(body, {
			algorithm: "md5",
			excludeKeys: (key) => key === "as",
		});
	}

	abstract getUsedFields(): string[];

	abstract getCost(): number;
	abstract negate(): QueryStep;
	abstract prefix(prefix: string): QueryStep;
	abstract toPipeline(): QueryStage[];
	abstract toPreparedStatement(): SQLPreparedStatement;
	abstract renameField(old_name: string, new_name: string): void;
}

export class Match extends QueryStep {
	body: MatchBody;

	constructor(body: MatchBody) {
		super();
		this.body = body;
		if (!body) {
			throw new Error("no body!");
		}
	}

	toPipeline(): [QueryStage] {
		return [{ $match: this.body }];
	}

	toPreparedStatement(): SQLPreparedStatement {
		const codeToSignMap: Record<string, string> = {
			$eq: "=",
			$ne: "!=",
			$gt: ">",
			$gte: ">=",
			$lt: "<",
			$lte: "<=",
		};
		const field = Object.keys(this.body)[0];
		if (field) {
			const sign = Object.keys(this.body[field] as any)[0];
			if (sign) {
				const parameter = (this.body[field] as any)[sign];
				const sqlSign = codeToSignMap[sign] || "";

				if (sign === "$in") {
					return {
						where: `${field} IN (${(parameter as any[])
							.map((_, index) => {
								return `$${index + 1}`;
							})
							.join(", ")})`,
						join: [],
						parameters: [...parameter],
					};
				}

				return {
					where: `${field} ${sqlSign} $1`,
					join: [],
					parameters: [parameter],
				};
			} else {
				throw new Error("sign is missing");
			}
		} else {
			throw new Error("field is missing");
		}
	}

	pushStage(pipeline: QueryStage[]): QueryStage[] {
		pipeline.push({ $match: this.body });
		return pipeline;
	}

	getUsedFields(): string[] {
		return getAllKeys(this.body)
			.map((path) => path.split("."))
			.reduce((acc, fields) =>
				acc.concat(fields.filter((field) => !field.startsWith("$")))
			);
	}

	getCost(): number {
		return this.body.$or ? 2 : 0;
	}

	negate(): Match {
		return new Match(negate_stage(this.body as QueryStage));
	}

	prefix(prefix: string): Match {
		const prop_regex = /^[a-z0-9_]/;
		const ret: MatchBody = {};
		for (const [prop, value] of Object.entries(this.body)) {
			const new_prop =
				prop_regex.test(prop) && !Array.isArray(value)
					? prefix + "." + prop
					: prop;
			if (prop == "$or" || prop == "$and" || prop == "$nor") {
				const new_values = (value as MatchBody[]).map(
					(match_body) => new Match(match_body).prefix(prefix).body
				);
				ret[new_prop] = new_values;
			} else if (prop === "$in") {
				ret[new_prop] = (value as string[]).map((v) =>
					v.replace(/^\$/, "$" + prefix + ".")
				);
			} else if (value instanceof Object) {
				ret[new_prop] = new Match(value as MatchBody).prefix(
					prefix
				).body;
			} else {
				if (typeof value === "string") {
					ret[new_prop] = value.startsWith("$")
						? value.replace("$", "$" + prefix + ".")
						: value;
				} else {
					ret[new_prop] = value;
				}
			}
		}
		return new Match(ret);
	}

	renameField(old_name: string, new_name: string): void {
		this.body = transformObject(
			this.body,
			(prop) => {
				if (prop === old_name) {
					return new_name;
				}
				if (prop.split(".")[0] === old_name) {
					return [new_name, ...prop.split(".").slice(1)].join(".");
				}
				return prop;
			},
			(prop, value) => value
		);
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

export type SimpleLookupBodyInput = {
	from: string;
	localField: string;
	foreignField: string;
	unwind?: boolean;
	as?: string;
};

export type SimpleLookupBody = SimpleLookupBodyInput & { as: string };

export type ComplexLookupBodyInput = {
	from: string;
	let: Record<string, string>;
	pipeline: QueryStage[];
	unwind?: boolean;
	as?: string;
};

export type ComplexLookupBody = ComplexLookupBodyInput & { as: string };

export type LookupBody = ComplexLookupBody | SimpleLookupBody;

export type LookupBodyInput = ComplexLookupBodyInput | SimpleLookupBodyInput;

export abstract class Lookup extends QueryStep {
	abstract getUsedFields(): string[];
	body: LookupBody;
	unwind: boolean;

	constructor(
		body: SimpleLookupBodyInput | ComplexLookupBodyInput,
		rehash = false
	) {
		super();
		let hash: string = body.as || Lookup.hashBody(body);
		if (!body.as || rehash) {
			hash = Lookup.hashBody(body);
		}
		this.body = {
			...body,
			as: hash,
		};
		this.unwind = body.unwind || false;
	}

	static hashBody(body: LookupBodyInput): string {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { as, ...rest } = body;
		return QueryStep.hashBody(rest);
	}

	getCost(): number {
		return 8;
	}

	negate(): QueryStep {
		return this;
	}

	hash(): string {
		if (!this.body.as) {
			throw new Error(
				"Cannot hash a lookup step without an `as` property"
			);
		}
		return this.body.as;
	}

	static isComplexBody(
		body: ComplexLookupBodyInput | SimpleLookupBodyInput
	): body is ComplexLookupBodyInput {
		return Object.prototype.hasOwnProperty.call(body, "let") as boolean;
	}

	static fromBody(
		body: ComplexLookupBodyInput | SimpleLookupBodyInput,
		rehash = false
	): Lookup {
		if (Lookup.isComplexBody(body)) {
			return new ComplexLookup(body, rehash);
		} else {
			return new SimpleLookup(body, rehash);
		}
	}

	toPipeline(): QueryStage[] {
		const ret = { $lookup: { ...this.body } };
		delete ret.$lookup.unwind;
		return [
			ret,
			...(this.body.unwind ? [{ $unwind: `$${this.body.as}` }] : []),
		];
	}

	toPreparedStatement(): SQLPreparedStatement {
		if ("pipeline" in this.body) {
			// https://hub.sealcode.org/source/sealious/browse/master/src/app/policy-types/same-as-for-resource-in-field.ts$89-93
			throw new Error(
				"Yet to be implemented. For now use only simple lookups when using sql."
			);
		}

		return {
			where: "",
			join: [
				`${this.body.from} ON currenttable.${this.body.localField} = ${this.body.as}.${this.body.foreignField}`,
			],
			parameters: [],
		};
	}

	renameField(old_name: string, new_name: string) {
		Function.prototype(); //noop
	}
}

export class SimpleLookup extends Lookup {
	unwind: boolean;
	body: SimpleLookupBody;
	used_fields: string[];

	getUsedFields(): string[] {
		return this.body.localField.split(".");
	}

	prefix(prefix: string) {
		return new SimpleLookup({
			from: this.body.from,
			localField: `${prefix}.${this.body.localField}`,
			foreignField: this.body.foreignField,
			unwind: this.unwind,
			as: `${prefix}.${this.body.as}`,
		});
	}
}

export class ComplexLookup extends Lookup {
	body: ComplexLookupBody;
	getUsedFields(): string[] {
		return Object.values(this.body.let).map((entry) =>
			entry.replace(/\$/g, "")
		);
	}

	prefix(prefix: string): Lookup {
		const ret = new ComplexLookup({
			from: this.body.from,
			let: Object.fromEntries(
				Object.entries(this.body.let).map(([key, value]) => [
					key,
					value.replace("$", "$" + prefix + "."),
				])
			),
			pipeline: this.body.pipeline,
			// .map((stage) =>
			// 	QueryStep.fromStage(stage).map((step) =>
			// 		step.prefix(prefix)
			// 	)
			// )
			// .reduce((acc, cur) => acc.concat(cur))
			// .map((step) => step.toPipeline())
			// .reduce((acc, cur) => acc.concat(cur)),
			as: prefix + "." + this.body.as,
		});
		return ret;
	}
}

abstract class SimpleQueryStep<T> {
	abstract getStageName: () => string;
	constructor(public body: T) {}
	prefix(): SimpleQueryStep<T> {
		return this;
	}
	getCost() {
		return 2;
	}
	toPipeline(): QueryStage[] {
		return [{ [this.getStageName()]: this.body }];
	}
	toPreparedStatement(): SQLPreparedStatement {
		throw new Error(
			"Yet to be implemented. For now use only simple lookups when using sql."
		);
	}
	hash() {
		return object_hash(this.body);
	}
	getUsedFields() {
		return [];
	}
	negate() {
		return this;
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
	renameField(_: string, __: string): void {}
}

export class Group extends SimpleQueryStep<{ _id: any; [key: string]: any }> {
	getStageName = () => "$group";
}

export class Unwind extends SimpleQueryStep<string> {
	getStageName = () => "$unwind";

	renameField(old_name: string, new_name: string): void {
		if ((this.body = "$" + old_name)) {
			this.body = "$" + new_name;
		}
	}
}
