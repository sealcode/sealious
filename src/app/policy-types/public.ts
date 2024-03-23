import { Context, Policy } from "../../main.js";
import { AllowAll } from "../../datastore/allow-all.js";

export default class Public extends Policy {
	static type_name = "public";
	async _getRestrictingQuery() {
		return new AllowAll();
	}
	async checkerFunction(context: Context) {
		return Policy.allow(context.app.i18n("policy_public_allow"));
	}
	isItemSensitive = async () => false;
}
