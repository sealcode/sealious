import type { Context } from "../../main";
import Policy from "../../chip-types/policy";
import DenyAll from "../../datastore/deny-all";

export default class Noone extends Policy {
	static type_name = "noone";
	async _getRestrictingQuery() {
		return new DenyAll();
	}
	async checkerFunction(context: Context) {
		return Policy.deny(context.app.i18n("policy_noone_deny"));
	}
	isItemSensitive = async () => false;
}
