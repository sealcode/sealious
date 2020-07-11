import { LeafSubject } from "../subject";
import * as Errors from "../../response/errors";
import Context from "../../context";
import { DeleteActionName } from "../../action";
import Item from "../../../common_lib/response/item";

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
			const session_sealious_response = await this.app.runAction(
				new this.app.SuperContext(),
				["collections", "sessions"],
				"show",
				{
					filter: { "session-id": context.session_id },
				}
			);

			await Promise.all(
				session_sealious_response.items.map((session: Item) =>
					this.app.runAction(
						new this.app.SuperContext(),
						["collections", "sessions", session.id],
						"delete"
					)
				)
			);

			const anonymous_session_sealious_response = await this.app.runAction(
				new this.app.SuperContext(),
				["collections", "anonymous-sessions"],
				"show",
				{
					filter: {
						"anonymous-session-id": context.anonymous_session_id,
					},
				}
			);

			await Promise.all(
				anonymous_session_sealious_response.items.map((session: Item) =>
					this.app.runAction(
						new this.app.SuperContext(),
						["collections", "anonymous-sessions", session.id],
						"delete"
					)
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
