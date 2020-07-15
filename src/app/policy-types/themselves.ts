import SingleItemResponse from "../../../common_lib/response/single-item-response";
import { Context, Policy, Query } from "../../main";

export default class Themselves extends Policy {
	static type_name = "themselves";
	isItemSensitive = async () => true;
	async _getRestrictingQuery(context: Context) {
		return Query.fromSingleMatch({
			sealious_id: { $eq: context.user_id },
		});
	}
	async checkerFunction(context: Context, item: SingleItemResponse) {
		const user_id = item.id;
		if (context.user_id !== user_id) {
			return Policy.deny(`you are not the user of id ${user_id}.`);
		}
		return Policy.allow("you are the user in question");
	}
}
