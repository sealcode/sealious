import { Policy, Context, Query, CollectionItem } from "../../main.js";
import DenyAll from "../../datastore/deny-all.js";
import type { ItemMetadata } from "../../chip-types/collection-item.js";

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
			return Policy.allow(context.i18n`You have created this item.`);
		} else {
			return Policy.deny(
				context.i18n`You're not the user who created this item`
			);
		}
	}
	isItemSensitive = async () => true;
}
