import AccessStrategy from "../../chip-types/access-strategy";
import DenyAll from "../../datastore/deny-all";

class Noone extends AccessStrategy {
	static type_name = "noone";
	async _getRestrictingQuery() {
		return new DenyAll();
	}
	async checkerFunction() {
		return AccessStrategy.deny("noone is allowed");
	}
	isItemSensitive = async () => false;
}

export default new Noone();
