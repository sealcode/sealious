import AccessStrategy from "../../../chip-types/access-strategy.js";
import { Context, App } from "../../../main.js";

const Query = require("../../../datastore/query.js").default;

export default class LoggedIn extends AccessStrategy {
	constructor(app: App) {
		super(app, {});
	}
	async getRestrictingQuery(context: Context) {
		if (context.user_id) {
			return new Query.AllowAll();
		}
		return new Query.DenyAll();
	}
	async checkerFunction(context: Context) {
		if (context.user_id) {
			return AccessStrategy.allow("you are logged in");
		} else {
			return AccessStrategy.deny("you are not logged in");
		}
	}
}
