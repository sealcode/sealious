import { Policy, Context, Query, CollectionItem } from "../../main";
import DenyAll from "../../datastore/deny-all";
import type { ItemMetadata } from "../../chip-types/collection-item";

export default class Owner extends Policy {
	static type_name = "owner";
	async _getRestrictingQuery(context: Context) {
		if (context.user_id) {
			return Query.fromSingleMatch({
				"_metadata.created_by": { $eq: context.user_id },
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
				(
					response as unknown as {
						_metadata: ItemMetadata;
					}
				)._metadata.created_by
		) {
			return Policy.allow(context.app.i18n("policy_owner_allow"));
		} else {
			return Policy.deny(context.app.i18n("policy_owner_deny"));
		}
	}
	isItemSensitive = async () => true;
}
