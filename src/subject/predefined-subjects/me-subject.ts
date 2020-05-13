import { LeafSubject } from "../subject.js";
import * as Errors from "../../response/errors";
import { ActionName } from "../../action.js";
import Context from "../../context.js";

export default class MeSubject extends LeafSubject {
	async performAction(
		context: Context,
		action_name: ActionName,
		params: any
	) {
		if (!context.user_id) {
			throw new Errors.InvalidCredentials("You're not logged in!");
		}
		try {
			return await this.app.run_action(
				context,
				["collections", "users", context.user_id],
				action_name,
				params
			);
		} catch (error) {
			if (error.type === "not_found") {
				throw new Errors.InvalidCredentials("You're not logged in!");
			}
			throw error;
		}
	}
}
