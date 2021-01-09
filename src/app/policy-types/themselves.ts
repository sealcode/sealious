import { CollectionItem, Context, Policy, Query } from "../../main";

export default class Themselves extends Policy {
	static type_name = "themselves";
	isItemSensitive = async () => true;
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
			return Policy.deny(`you are not the user of id ${user_id}.`);
		}
		return Policy.allow("you are the user in question");
	}
}
