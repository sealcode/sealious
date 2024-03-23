import {
	Policy,
	Query,
	Context,
	QueryTypes,
	CollectionItem,
} from "../../main.js";

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
		if (!context.user_id)
			return Policy.deny(context.app.i18n("policy_logged_in_deny"));
		const item = await item_getter();

		await item.decode(context);

		if (context.user_id !== item.get(this.field_name))
			return Policy.deny(
				context.app.i18n("policy_user_referenced_in_field_deny")
			);

		return Policy.allow(
			context.app.i18n("policy_user_referenced_in_field_allow", [
				this.field_name,
			])
		);
	}
	isItemSensitive = async () => true;
}
