import type { Context } from "../../main.js";
import Policy from "../../chip-types/policy.js";
import DenyAll from "../../datastore/deny-all.js";

export default class Noone extends Policy {
	static type_name = "noone";
	async _getRestrictingQuery() {
		return new DenyAll();
	}
	async checkerFunction(context: Context) {
		return Policy.deny(context.i18n`Noone is allowed.`);
	}
	isItemSensitive = async () => false;
}
