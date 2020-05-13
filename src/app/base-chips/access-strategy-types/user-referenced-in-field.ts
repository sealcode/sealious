import {
	AccessStrategy,
	Query,
	App,
	Context,
	SingleItemResponse,
} from "../../../main";

export default class UserReferencedInField extends AccessStrategy {
	field_name: string;
	constructor(app: App, field_name: string) {
		super(app, field_name);
		this.field_name = field_name;
	}
	async getRestrictingQuery(context: Context) {
		if (!context.user_id) return new Query.DenyAll();
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
