import SealiousResponse from "../../common_lib/response/sealious-response";
import Context from "../context";
import Query from "../datastore/query";
import { AllowAll } from "../datastore/allow-all";

export type PolicyDefinition = [PolicyClass, any] | Policy | PolicyClass;

export type PolicyDecision = {
	allowed: boolean;
	reason: string;
} | null;

export type PolicyClass = {
	new (params: any): Policy;
	type_name: string;
};

export default abstract class Policy {
	static type_name: string;
	constructor(public params: any = {}) {
		this.params = params;
	}

	// return null if not possible to give an answer
	abstract checkerFunction(
		context: Context,
		sealious_response?: SealiousResponse
	): Promise<PolicyDecision | null>;

	async isItemSensitive() {
		return false;
	}

	protected abstract _getRestrictingQuery(context: Context): Promise<Query>;

	async getRestrictingQuery(context: Context): Promise<Query> {
		if (context.is_super) {
			return new AllowAll();
		}
		return this._getRestrictingQuery(context);
	}

	async check(
		context: Context,
		sealious_response?: SealiousResponse
	): Promise<PolicyDecision | null> {
		if (context.is_super) {
			return Policy.allow("super-context is always allowed");
		}

		const is_item_sensitive = await this.isItemSensitive();

		if (is_item_sensitive && sealious_response === undefined) {
			return null;
		}

		return this.checkerFunction(context, sealious_response);
	}

	public static fromDefinition(definition: PolicyDefinition): Policy {
		let ret: Policy | null = null;
		if (definition instanceof Policy) {
			ret = definition;
		} else if (Array.isArray(definition)) {
			ret = new definition[0](definition[1]);
		} else if (typeof definition == "function") {
			ret = new (definition as PolicyClass)({});
		}
		if (!ret) {
			throw new Error("could not read the definition");
		}
		return ret;
	}

	static allow(reason: string) {
		return { allowed: true, reason };
	}

	static deny(reason: string) {
		return { allowed: false, reason };
	}
}

export abstract class ReducingPolicy extends Policy {
	policies: Policy[];
	constructor(params: PolicyDefinition[]) {
		super(params);
		this.policies = params.map((definition) =>
			Policy.fromDefinition(definition)
		);
	}
	checkAllPolicies(
		context: Context,
		response?: SealiousResponse
	): Promise<PolicyDecision[]> {
		return Promise.all(
			this.policies.map((strategy) => strategy.check(context, response))
		);
	}
}
