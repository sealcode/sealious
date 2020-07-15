import { ActionName } from "../action";

import assert from "assert";

export type When = "before" | "after";

export type MatcherParams = {
	when: When;
	subject_path: RegExp;
	action: ActionName | ActionName[];
};

export class EventMatcher {
	when: When;
	subject_path: RegExp;
	actions: ActionName[];
	collection_name: null | string;
	constructor({ when, subject_path = /.*/, action }: MatcherParams) {
		if (arguments[0] instanceof EventMatcher) {
			return arguments[0];
		}
		assert.equal(typeof when, "string");
		assert(subject_path instanceof RegExp);
		assert(typeof action === "string" || Array.isArray(action));
		this.when = when;
		this.subject_path = subject_path;
		if (Array.isArray(action)) {
			this.actions = action;
		} else {
			this.actions = [action];
		}
	}
	containsAction(action_name: ActionName) {
		return this.actions.includes(action_name);
	}
}

export class CollectionMatcher extends EventMatcher {
	collection_name: string;
	constructor({
		when,
		collection_name,
		action,
	}: Pick<MatcherParams, "when" | "action"> & { collection_name: string }) {
		super({
			when,
			subject_path: new RegExp(`collections.${collection_name}`),
			action,
		});
		assert.equal(typeof collection_name, "string");
		this.collection_name = collection_name;
	}
}

export class Resource extends EventMatcher {
	collection_name: string;
	constructor({
		when,
		collection_name,
		action,
	}: Pick<MatcherParams, "when" | "action"> & { collection_name: string }) {
		super({
			when,
			subject_path: new RegExp(`collections.${collection_name}\\..*`),
			action,
		});
		assert.equal(typeof collection_name, "string");
		this.collection_name = collection_name;
	}
}
