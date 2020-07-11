import { AccessStrategy } from "../../main";
import { AllowAll } from "../../datastore/allow-all";

class Public extends AccessStrategy {
	static type_name = "public";
	async _getRestrictingQuery() {
		return new AllowAll();
	}
	async checkerFunction() {
		return AccessStrategy.allow("everyone is allowed");
	}
	isItemSensitive = async () => false;
}

export default new Public();
