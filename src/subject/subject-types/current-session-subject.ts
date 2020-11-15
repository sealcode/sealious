import { LeafSubject } from "../subject";
import * as Errors from "../../response/errors";
import Context from "../../context";
import { DeleteActionName } from "../../action";
import ItemList from "../../chip-types/item-list";

export default class CurrentSession extends LeafSubject {
	async performAction(
		context: Context,
		action_name: DeleteActionName,
		_: any
	) {
		if (action_name !== "delete") {
			throw new Errors.DeveloperError(
				`Unknown action ${action_name} for CurrentSession subject.`
			);
		}
		try {
			const sessions = await new ItemList(
				this.app.collections.sessions,
				new this.app.SuperContext()
			)
				.filter({ "session-id": context.session_id })
				.fetch();
			await Promise.all(
				sessions.items.map(async (session) =>
					session.remove(new this.app.SuperContext())
				)
			);
			return "You've been logged out";
		} catch (e) {
			return Promise.reject(new Errors.BadContext("Invalid session id!"));
		}
	}
	getName() {
		return "CurrentSession";
	}
}
