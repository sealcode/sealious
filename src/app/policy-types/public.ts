import { Context, Policy } from "../../main.js";
import { AllowAll } from "../../datastore/allow-all.js";

export default class Public extends Policy {
	static type_name = "public";
	async _getRestrictingQuery() {
		return new AllowAll();
	}
	async checkerFunction(context: Context) {
		return Policy.allow(context.i18n`Everyone is allowed.`);
	}
	isItemSensitive = async () => false;
}
