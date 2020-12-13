import Policy from "../../chip-types/policy";
import { Context } from "../../main";
import { AllowAll } from "../../datastore/allow-all";
import DenyAll from "../../datastore/deny-all";

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
			return Policy.allow("you are logged in");
		} else {
			return Policy.deny("you are not logged in");
		}
	}
}
