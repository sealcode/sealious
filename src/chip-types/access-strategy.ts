import App from "../app/app.js";
import SealiousResponse from "../../common_lib/response/sealious-response.js";
import Context from "../context.js";
import * as Errors from "../response/errors";
import Query from "../datastore/query.js";
import { ChipTypeName } from "../app/chip-manager.js";
import Chip from "./chip.js";

export type AccessStrategyDefinition =
	| [string, any]
	| string
	| {
			type: "string" | { new (app: App, params?: any): AccessStrategy };
			params: any;
	  }
	| AccessStrategy;

export type AccessStrategyDecision = {
	allowed: boolean;
	reason: string;
};

export default abstract class AccessStrategy extends Chip {
	app: App;
	type_name: ChipTypeName = "access_strategy_type";
	params: any;
	constructor(app: App, params: any) {
		super();
		this.app = app;
		this.params = params;
	}

	abstract checkerFunction(
		context: Context,
		sealious_response?: SealiousResponse
	): Promise<AccessStrategyDecision | null>;

	async isItemSensitive() {
		return false;
	}

	abstract getRestrictingQuery(context: Context): Promise<Query>;

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
		app: App,
		definition: AccessStrategyDefinition
	) {
		if (definition instanceof AccessStrategy) {
			return definition;
		}
		const [type_name, params] =
			typeof definition === "string"
				? [definition, null]
				: Array.isArray(definition)
				? [definition[0], definition[1] || null]
				: [definition.type, definition.params || null];
		const constructor = (app.ChipManager.getAccessStrategy(
			type_name
		) as unknown) as new (app: App, params: any) => AccessStrategy;
		return new constructor(app, params);
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
	constructor(app: App, params: AccessStrategyDefinition[]) {
		super(app, params);
		this.access_strategies = params.map((definition) =>
			AccessStrategy.fromDefinition(app, definition)
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
