import AccessStrategy from "../../../chip-types/access-strategy.js";

const Query = require("../../../datastore/query.js").default;

export default class Noone extends AccessStrategy {
	async getRestrictingQuery() {
		return new Query.DenyAll();
	}
	async checkerFunction() {
		return AccessStrategy.deny("noone is allowed");
	}
	isItemSensitive = async () => false;
}
