import { CollectionItem, Context, Policy, Query } from "../../main";

export default class Themselves extends Policy {
	static type_name = "themselves";
	isItemSensitive = async (_: Context) => true;
	async _getRestrictingQuery(context: Context) {
		return Query.fromSingleMatch({
			id: { $eq: context.user_id },
		});
	}
	async checkerFunction(
		context: Context,
		item_getter: () => Promise<CollectionItem>
	) {
		const user_id = (await item_getter()).id;
		if (context.user_id !== user_id) {
			return Policy.deny(
				context.app.i18n("policy_themselves_deny", [user_id])
			);
		}
		return Policy.allow(context.app.i18n("policy_themselves_allow"));
	}
}
