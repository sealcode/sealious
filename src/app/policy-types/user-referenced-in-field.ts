import { Policy, Query, Context, QueryTypes, CollectionItem } from "../../main";

export default class UserReferencedInField extends Policy {
	static type_name = "user-referenced-in-field";
	field_name: string;
	constructor(field_name: string) {
		super(field_name);
		this.field_name = field_name;
	}
	async _getRestrictingQuery(context: Context) {
		if (!context.user_id) return new QueryTypes.DenyAll();
		return Query.fromSingleMatch({
			[this.field_name]: context.user_id,
		});
	}
	async checkerFunction(
		context: Context,
		item_getter: () => Promise<CollectionItem>
	) {
		if (!context.user_id) return Policy.deny("you are not logged in");
		const item = await item_getter();
		if (context.user_id !== item.get(this.field_name))
			return Policy.deny(
				`you are not the user mentioned in field ${this.field_name}`
			);
		return Policy.allow(
			`you are the user mentioned in field ${this.field_name}`
		);
	}
	isItemSensitive = async () => true;
}
