"use strict";
const assert = require("assert");
const locreq = require("locreq")(__dirname);

const ActionResultCache = new WeakMap();

function hash_call(subject_path, action_name, params) {
	const to_map = [subject_path, action_name, params];
	return to_map.map(e => JSON.stringify(e)).join(", ");
}

function get_event_name(stage, subject_path, action_name) {
	return `${stage}:${subject_path.join(".")}:${action_name}`;
}

function run_action_curry(app) {
	return function run_action(context, subject_path, action_name, params) {
		const original_context = context.is_super
			? context.original_context
			: context;

		if (!ActionResultCache.has(original_context)) {
			ActionResultCache.set(original_context, new Map());
		}
		app.Logger.debug(subject_path, action_name, params);

		const hash = hash_call(subject_path, action_name, params);

		original_context.total = original_context.total + 1 || 1;

		if (ActionResultCache.get(original_context).has(hash)) {
			original_context.from_cache = original_context.from_cache + 1 || 1;
			return ActionResultCache.get(original_context).get(hash);
		} else {
			let subject = null;
			const promise = app.RootSubject.get_subject(subject_path)
				.then(function(_subject) {
					subject = _subject;
					const event_name = get_event_name(
						"pre",
						subject_path,
						action_name
					);
					return app.emit(event_name, context, subject_path, params);
				})
				.then(function(new_params) {
					if (new_params[0] !== undefined) {
						params = new_params[0];
					}
					return subject.perform_action(context, action_name, params);
				})
				.then(function(response) {
					const event_name = get_event_name(
						"post",
						subject_path,
						action_name
					);
					return app
						.emit(
							event_name,
							context,
							subject_path,
							params,
							response
						)
						.then(function(new_responses) {
							for (let new_response of new_responses) {
								if (
									new_response instanceof
									app.Sealious.OverwriteResponse
								) {
									return new_response.response;
								}
							}
							return response;
						});
				});

			if (action_name === "show") {
				ActionResultCache.get(original_context).set(hash, promise);
			}
			if (action_name !== "show") {
				ActionResultCache.delete(original_context);
			}

			return promise;
		}
	};
}

module.exports = run_action_curry;
