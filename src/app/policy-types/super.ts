import Policy from "../../chip-types/policy.js";
import type Context from "../../context.js";
import DenyAll from "../../datastore/deny-all.js";
import { AllowAll } from "../../datastore/allow-all.js";

export default class Super extends Policy {
	static type_name = "super";
	async _getRestrictingQuery(context: Context) {
		if (context.is_super) {
			return new AllowAll();
		}
		return new DenyAll();
	}
	async checkerFunction(context: Context) {
		if (context.is_super) {
			return Policy.allow(context.app.i18n("policy_super_allow"));
		} else {
			return Policy.deny(context.app.i18n("policy_super_deny"));
		}
	}
	isItemSensitive = async (_: Context) => false;
}
