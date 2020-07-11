import { Context, ActionName, App } from "../main";
import { NotFound } from "../response/errors";

const ActionResultCache = new WeakMap();

export function runActionCurry(app: App) {
	return async function runAction(
		context: Context,
		subject_path: string[],
		action_name: ActionName,
		params: any
	) {
		if (!action_name) {
			throw new Error("Action name not provided");
		}
		const original_context = context.original_context || context;

		if (!ActionResultCache.has(original_context)) {
			ActionResultCache.set(original_context, new Map());
		}
		app.Logger.debug(subject_path.toString(), action_name, params);

		const subject = await app.RootSubject.getSubject(subject_path);
		if (!subject) {
			throw new NotFound("Subject not found: " + subject_path.toString());
		}
		params = await app.emitHook(
			{
				when: "before",
				subject_path: subject_path.join("."),
				action: action_name,
				metadata: {
					context,
					params,
				},
			},
			params
		);

		const response = await subject.performAction(
			context,
			action_name,
			params
		);
		return app.emitHook(
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
		);
	};
}
