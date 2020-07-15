import Policy from "../../chip-types/policy";
import DenyAll from "../../datastore/deny-all";

class Noone extends Policy {
	static type_name = "noone";
	async _getRestrictingQuery() {
		return new DenyAll();
	}
	async checkerFunction() {
		return Policy.deny("noone is allowed");
	}
	isItemSensitive = async () => false;
}

export default new Noone();
