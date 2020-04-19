"use strict";
const assert = require("assert");
const locreq = require("locreq")(__dirname);

const ActionResultCache = new WeakMap();

function hash_call(subject_path, action_name, params, context) {
	const to_map = [
		subject_path,
		action_name,
		params,
		context.user_id,
		context.is_super,
	];
	return to_map.map((e) => JSON.stringify(e)).join(", ");
}

function run_action_curry(app) {
	return async function run_action(
		context,
		subject_path,
		action_name,
		params
	) {
		if (!action_name) {
			throw new Error("Action name not provided");
		}
		const original_context = context.original_context || context;

		if (!ActionResultCache.has(original_context)) {
			ActionResultCache.set(original_context, new Map());
		}
		app.Logger.debug(subject_path, action_name, params);

		const hash = hash_call(subject_path, action_name, params, context);

		original_context.total = original_context.total + 1 || 1;

		if (ActionResultCache.get(original_context).has(hash)) {
			original_context.from_cache = original_context.from_cache + 1 || 1;
			return ActionResultCache.get(original_context).get(hash);
		}
		let subject = null;
		const promise = app.RootSubject.get_subject(subject_path)
			.then(function (_subject) {
				subject = _subject;
				return app.emit(
					{
						when: "before",
						subject_path: subject_path.join("."),
						action: action_name,
						metadata: {
							context,
						},
					},
					params
				);
			})
			.then((params) =>
				subject.perform_action(context, action_name, params)
			)
			.then((response) =>
				app.emit(
					{
						when: "after",
						subject_path: subject_path.join("."),
						action: action_name,
						metadata: {
							context,
							params,
						},
					},
					response
				)
			);

		if (action_name === "show") {
			ActionResultCache.get(original_context).set(hash, promise);
		} else {
			ActionResultCache.delete(original_context);
		}

		return promise;
	};
}

module.exports = run_action_curry;
