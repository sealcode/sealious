import SealiousResponse from "../../common_lib/response/sealious-response";
import Context from "../context";
import Query from "../datastore/query";
import { AllowAll } from "../datastore/allow-all";

export type AccessStrategyDefinition =
	| [AccessStrategyClass, any]
	| AccessStrategy
	| AccessStrategyClass;

export type AccessStrategyDecision = {
	allowed: boolean;
	reason: string;
} | null;

export type AccessStrategyClass = {
	new (params: any): AccessStrategy;
	type_name: string;
};

export default abstract class AccessStrategy {
	static type_name: string;
	constructor(public params: any = {}) {
		this.params = params;
	}

	// return null if not possible to give an answer
	abstract checkerFunction(
		context: Context,
		sealious_response?: SealiousResponse
	): Promise<AccessStrategyDecision | null>;

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
	): Promise<AccessStrategyDecision | null> {
		if (context.is_super) {
			return AccessStrategy.allow("super-context is always allowed");
		}

		const is_item_sensitive = await this.isItemSensitive();

		if (is_item_sensitive && sealious_response === undefined) {
			return null;
		}

		return this.checkerFunction(context, sealious_response);
	}

	public static fromDefinition(
		definition: AccessStrategyDefinition
	): AccessStrategy {
		let ret: AccessStrategy | null = null;
		if (definition instanceof AccessStrategy) {
			ret = definition;
		} else if (Array.isArray(definition)) {
			ret = new definition[0](definition[1]);
		} else if (typeof definition == "function") {
			ret = new (definition as AccessStrategyClass)({});
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

export abstract class ReducingAccessStrategy extends AccessStrategy {
	access_strategies: AccessStrategy[];
	constructor(params: AccessStrategyDefinition[]) {
		super(params);
		this.access_strategies = params.map((definition) =>
			AccessStrategy.fromDefinition(definition)
		);
	}
	checkAllStrategies(
		context: Context,
		response?: SealiousResponse
	): Promise<AccessStrategyDecision[]> {
		return Promise.all(
			this.access_strategies.map((strategy) =>
				strategy.check(context, response)
			)
		);
	}
}
