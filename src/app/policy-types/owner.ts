import { Policy, Context, Query, CollectionItem } from "../../main";
import DenyAll from "../../datastore/deny-all";

export default class Owner extends Policy {
	static type_name = "owner";
	async _getRestrictingQuery(context: Context) {
		if (context.user_id) {
			return Query.fromSingleMatch({
				"_metadata.created_context.user_id": { $eq: context.user_id },
			});
		}
		return new DenyAll();
	}
	async checkerFunction(
		context: Context,
		item_getter: () => Promise<CollectionItem>
	) {
		const response = await item_getter();
		if (
			context.user_id &&
			context.user_id ===
				((response as unknown) as {
					_metadata: { created_context: { user_id: string } };
				})._metadata.created_context.user_id
		) {
			return Policy.allow("you are who created this item");
		} else {
			return Policy.deny("you are not who created this item");
		}
	}
	isItemSensitive = async () => true;
}
