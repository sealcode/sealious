const Bluebird = require("bluebird");
const assert = require("assert");

class Hook {
	constructor({ event_matcher, callback, is_blocking = true }) {
		assert.equal(typeof callback, "function");
		assert.equal(typeof is_blocking, "boolean");
		this.event_matcher = event_matcher;
		this.callback = callback;
		this.is_blocking = is_blocking;
	}
	appliesTo(event_description) {
		return event_description.isEquivalentTo(this.event_matcher);
	}
}

class EventMatcher {
	constructor({ when, subject_path = /.*/, action }) {
		if (arguments[0] instanceof EventMatcher) {
			return arguments[0];
		}
		assert.equal(typeof when, "string");
		assert(subject_path instanceof RegExp);
		assert(typeof action === "string" || Array.isArray(action));
		this.when = when;
		this.subject_path = subject_path;
		this.action = action;
	}
	containsAction(action_name) {
		if (typeof this.action === "string") {
			return this.action === action_name;
		}
		if (Array.isArray(this.action)) {
			return this.action.includes(action_name);
		}
		return false;
	}
}

class CollectionEventMatcher extends EventMatcher {
	constructor({ when, collection_name, action }) {
		super({
			when,
			subject_path: new RegExp(`collections.${collection_name}`),
			action,
		});
		assert.equal(typeof collection_name, "string");
		this.collection_name = collection_name;
	}
}

class ResourceEventMatcher extends EventMatcher {
	constructor({ when, collection_name, action }) {
		super({
			when,
			subject_path: new RegExp(`collections.${collection_name}\\..*`),
			action,
		});
		assert.equal(typeof collection_name, "string");
		this.collection_name = collection_name;
	}
}

class EventDescription {
	constructor({ when, subject_path = "", action, metadata = {} }) {
		assert.equal(typeof when, "string");
		assert.equal(typeof subject_path, "string");
		assert.equal(typeof action, "string");
		assert.equal(typeof metadata, "object");
		this.when = when;
		this.subject_path = subject_path;
		this.action = action;
		this.metadata = metadata;
	}
	isEquivalentTo(source_event) {
		return (
			this.matchWhen(source_event) &&
			this.matchAction(source_event) &&
			this.matchSubjectPath(source_event)
		);
	}
	matchWhen(source_event) {
		return this.when === source_event.when;
	}
	matchAction(source_event) {
		if (typeof source_event.action === "string") {
			return source_event.action === this.action;
		}
		if (Array.isArray(source_event.action)) {
			return source_event.action.includes(this.action);
		}
		return false;
	}
	matchSubjectPath(source_event) {
		return source_event.subject_path.test(this.subject_path);
	}
}

class Hookable {
	constructor() {
		this.hooks = [];
	}
	addHook(event_description, callback, is_blocking) {
		const event_matcher = new EventMatcher(event_description);
		const hook = new Hook({ event_matcher, callback, is_blocking });
		this.hooks.push(hook);
	}
	async emit(_event_description, data = {}) {
		const emitted_event = new EventDescription(_event_description);
		return await Bluebird.reduce(
			this.hooks.filter(hook => hook.appliesTo(emitted_event)),
			async (acc, hook) =>
				(await hook.callback(emitted_event, acc)) || acc,
			data
		);
	}
}

module.exports = {
	Hookable,
	ResourceEventMatcher,
	CollectionEventMatcher,
	EventMatcher,
};
