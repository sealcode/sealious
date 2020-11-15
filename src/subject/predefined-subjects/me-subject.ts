import { LeafSubject } from "../subject";
import * as Errors from "../../response/errors";
import { ActionName } from "../../action";
import Context from "../../context";

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
			if (action_name === "show") {
				return this.app.collections.users
					.list(context)
					.setParams(params)
					.fetch();
			}
		} catch (error) {
			if (error.type === "not_found") {
				throw new Errors.InvalidCredentials("You're not logged in!");
			}
			throw error;
		}
	}
	getName() {
		return "me";
	}
}
