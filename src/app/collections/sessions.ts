import { App, Collection, FieldTypes, Policies } from "../../main";

export default class Sessions extends Collection {
	name = "sessions";
	fields = {
		"session-id": new FieldTypes.SessionID(),
		user: new FieldTypes.SingleReference("users"),
	};

	policies = {};
	defaultPolicy = new Policies.Super();
}
