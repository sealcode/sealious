import Policy from "../../chip-types/policy";
import Context from "../../context";
import { SingleItemResponse, Query } from "../../main";
import { AllowAll } from "../../datastore/allow-all";

export default class SameAnon extends Policy {
	static type_name = "same-anon";
	async _getRestrictingQuery(context: Context) {
		if (context.anonymous_user_id) {
			return Query.fromSingleMatch({
				"_metadata.created_context.anonymous_user_id":
					context.anonymous_user_id,
			});
		}
		return new AllowAll();
	}
	async checkerFunction(context: Context, item: SingleItemResponse) {
		if (context.anonymous_user_id === null) {
			return Policy.deny(
				"the system did not recognize your anonymous session"
			);
		}
		if (
			context.anonymous_user_id ===
			item._metadata.created_context.anonymous_user_id
		) {
			return Policy.allow(
				"you are the same user who created this resource"
			);
		} else {
			return Policy.deny(
				"you are not the same user who created this resource"
			);
		}
	}
	isItemSensitive = async () => true;
}
