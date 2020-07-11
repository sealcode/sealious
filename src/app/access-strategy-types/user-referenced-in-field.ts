import {
	AccessStrategy,
	Query,
	Context,
	SingleItemResponse,
	QueryTypes,
} from "../../main";

export default class UserReferencedInField extends AccessStrategy {
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
	async checkerFunction(context: Context, item: SingleItemResponse) {
		if (!context.user_id)
			return AccessStrategy.deny("you are not logged in");
		if (context.user_id !== item[this.field_name])
			return AccessStrategy.deny(
				`you are not the user mentioned in field ${this.field_name}`
			);
		return AccessStrategy.allow(
			`you are the user mentioned in field ${this.field_name}`
		);
	}
	isItemSensitive = async () => true;
}
