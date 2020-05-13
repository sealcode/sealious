import AccessStrategy from "../../../chip-types/access-strategy";

const Query = require("../../../datastore/query.js").default;

export default class Public extends AccessStrategy {
	async getRestrictingQuery() {
		return new Query.AllowAll();
	}
	async checkerFunction() {
		return AccessStrategy.allow("everyone is allowed");
	}
	isItemSensitive = async () => false;
}
