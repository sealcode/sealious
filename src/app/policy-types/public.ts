import { Policy } from "../../main";
import { AllowAll } from "../../datastore/allow-all";

class Public extends Policy {
	static type_name = "public";
	async _getRestrictingQuery() {
		return new AllowAll();
	}
	async checkerFunction() {
		return Policy.allow("everyone is allowed");
	}
	isItemSensitive = async () => false;
}

export default new Public();
