import SingleItemResponse from "../../../../common_lib/response/single-item-response";
import { Context, AccessStrategy } from "../../../main";

const Query = require("../../../datastore/query.js").default;

export default class Themselves extends AccessStrategy {
	isItemSensitive = async () => true;
	async getRestrictingQuery(context: Context) {
		return Query.fromSingleMatch({
			sealious_id: { $eq: context.user_id },
		});
	}
	async checkerFunction(context: Context, item: SingleItemResponse) {
		const user_id = item.id;
		if (context.user_id !== user_id) {
			return AccessStrategy.deny(
				`you are not the user of id ${user_id}.`
			);
		}
		return AccessStrategy.allow("you are the user in question");
	}
}
