import assert from "assert";
import { EventMatcher, When } from "./event-matchers";
import { ActionName } from "../action";
import Context from "../context";

type HookProps = {
	event_matcher: EventMatcher;
	callback: Function;
	is_blocking: boolean;
};

export class Hook {
	event_matcher: EventMatcher;
	callback: Function;
	is_blocking: boolean;
	constructor({ event_matcher, callback, is_blocking = true }: HookProps) {
		assert.equal(typeof callback, "function");
		assert.equal(typeof is_blocking, "boolean");
		this.event_matcher = event_matcher;
		this.callback = callback;
		this.is_blocking = is_blocking;
	}
	appliesTo(event_description: EventDescription) {
		const ret = event_description.isEquivalentTo(this.event_matcher);
		return ret;
	}
}

type EventDescriptionProps = {
	when: When;
	subject_path?: string;
	action: ActionName;
	metadata: { context: Context; params: any };
};

export class EventDescription {
	when: When;
	subject_path: string;
	action: ActionName;
	metadata: { context: Context; params: any };
	constructor({
		when,
		subject_path = "",
		action,
		metadata,
	}: EventDescriptionProps) {
		assert.equal(typeof when, "string");
		assert.equal(typeof subject_path, "string");
		assert.equal(typeof action, "string");
		assert.equal(typeof metadata, "object");
		this.when = when;
		this.subject_path = subject_path;
		this.action = action;
		this.metadata = metadata;
	}
	isEquivalentTo(matcher: EventMatcher) {
		return (
			this.matchWhen(matcher) &&
			this.matchAction(matcher) &&
			this.matchSubjectPath(matcher)
		);
	}
	matchWhen(matcher: EventMatcher) {
		return this.when === matcher.when;
	}
	matchAction(matcher: EventMatcher) {
		return matcher.actions.includes(this.action);
	}
	matchSubjectPath(matcher: EventMatcher) {
		return matcher.subject_path.test(this.subject_path);
	}
}

export class Hookable {
	hooks: Hook[] = [];
	addHook(
		matcher: EventMatcher,
		callback: (event: EventDescription, value: any) => Promise<any>, //for "before" value is the user input, for "after", `value` is system output. Both can be modified and overwritten by returning from callback
		is_blocking: boolean = false
	) {
		const hook = new Hook({
			event_matcher: matcher,
			callback,
			is_blocking,
		});
		this.hooks.push(hook);
	}
	async emitHook(_event_description: EventDescriptionProps, data = {}) {
		const emitted_event = new EventDescription(_event_description);
		const matching_hooks = this.hooks.filter((hook) =>
			hook.appliesTo(emitted_event)
		);
		for (const hook of matching_hooks) {
			const resp = await hook.callback(emitted_event, data);
			if (resp) {
				// console.log("changing", data, "to", resp);
				data = resp;
			}
		}
		return data;
	}
}
