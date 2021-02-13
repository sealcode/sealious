import Policy from "../../chip-types/policy";
import Context from "../../context";
import DenyAll from "../../datastore/deny-all";
import { AllowAll } from "../../datastore/allow-all";

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
			return Policy.allow("this method was ran with a supercontext");
		} else {
			return Policy.deny("this method was not ran with a supercontext");
		}
	}
	isItemSensitive = async (_: Context) => false;
}
