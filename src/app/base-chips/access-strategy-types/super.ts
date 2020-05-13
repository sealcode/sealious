import AccessStrategy from "../../../chip-types/access-strategy.js";
import Context from "../../../context.js";

const Query = require("../../../datastore/query.js").default;

export default class Super extends AccessStrategy {
	async getRestrictingQuery(context: Context) {
		if (context.is_super) {
			return new Query.AllowAll();
		}
		return new Query.DenyAll();
	}
	async checkerFunction(context: Context) {
		if (context.is_super) {
			return AccessStrategy.allow(
				"this method was ran with a supercontext"
			);
		} else {
			return AccessStrategy.allow(
				"this method was not ran with a supercontext"
			);
		}
	}
	isItemSensitive = async () => false;
}

module.exports = Super;
