import AccessStrategy from "../../../chip-types/access-strategy";
import Context from "../../../context";
import SingleItemResponse from "../../../../common_lib/response/single-item-response";

const Query = require("../../../datastore/query.js").default;

export default class SameAnon extends AccessStrategy {
	async getRestrictingQuery(context: Context) {
		if (context.anonymous_user_id) {
			return Query.fromSingleMatch({
				"_metadata.created_context.anonymous_user_id":
					context.anonymous_user_id,
			});
		}
		return new Query.AllowAll();
	}
	async checkerFunction(context: Context, item: SingleItemResponse) {
		if (context.anonymous_user_id === null) {
			return AccessStrategy.deny(
				"the system did not recognize your anonymous session"
			);
		}
		if (
			context.anonymous_user_id ===
			item._metadata.created_context.anonymous_user_id
		) {
			return AccessStrategy.allow(
				"you are the same user who created this resource"
			);
		} else {
			return AccessStrategy.deny(
				"you are not the same user who created this resource"
			);
		}
	}
	isItemSensitive = async () => true;
}
