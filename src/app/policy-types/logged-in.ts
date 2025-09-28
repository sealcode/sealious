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
			return Policy.allow(context.i18n`You are logged in.`);
		} else {
			return Policy.deny(context.i18n`You are not logged in.`);
		}
	}
}
