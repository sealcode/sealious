import Policy from "../../chip-types/policy.js";
import type { Context } from "../../main.js";
import { AllowAll } from "../../datastore/allow-all.js";
import DenyAll from "../../datastore/deny-all.js";

export default class LoggedIn extends Policy {
	static type_name = "logged-in";
	async _getRestrictingQuery(context: Context) {
		if (context.user_id) {
			return new AllowAll();
		}

		return new DenyAll();
	}
	async checkerFunction(context: Context) {
		if (context.user_id) {
			return Policy.allow(context.app.i18n("policy_logged_in_allow"));
		} else {
			return Policy.deny(context.app.i18n("policy_logged_in_deny"));
		}
	}
}
