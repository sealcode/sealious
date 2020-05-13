import { AccessStrategy, Context, Response } from "../../../main";

const Query = require("../../../datastore/query.js").default;

export default class Owner extends AccessStrategy {
	async getRestrictingQuery(context: Context) {
		if (context.user_id) {
			return Query.fromSingleMatch({
				"_metadata.created_context.user_id": { $eq: context.user_id },
			});
		}
		return new Query.DenyAll();
	}
	async checkerFunction(context: Context, response: Response) {
		if (
			context.user_id &&
			context.user_id ===
				((response as unknown) as {
					_metadata: { created_context: { user_id: string } };
				})._metadata.created_context.user_id
		) {
			return AccessStrategy.allow("you are who created this item");
		} else {
			return AccessStrategy.deny("you are not who created this item");
		}
	}
	isItemSensitive = async () => true;
}
