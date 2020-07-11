import AccessStrategy from "../../chip-types/access-strategy";
import { Context } from "../../main";
import { AllowAll } from "../../datastore/allow-all";
import DenyAll from "../../datastore/deny-all";

class LoggedIn extends AccessStrategy {
	static type_name = "logged-in";
	async _getRestrictingQuery(context: Context) {
		if (context.user_id) {
			return new AllowAll();
		}

		return new DenyAll();
	}
	async checkerFunction(context: Context) {
		if (context.user_id) {
			return AccessStrategy.allow("you are logged in");
		} else {
			return AccessStrategy.deny("you are not logged in");
		}
	}
}

export default new LoggedIn();
