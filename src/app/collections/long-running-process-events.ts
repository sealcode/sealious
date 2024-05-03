import Collection from "../../chip-types/collection.js";
import { FieldTypes, Policies } from "../../main.js";

export default class LongRunningProcessEvents extends Collection {
	name = "long_running_process_events";

	fields = {
		process: new FieldTypes.SingleReference(
			"long_running_processes"
		).setRequired(true),
		type: new FieldTypes.Enum(["info", "error"]).setRequired(true),
		message: new FieldTypes.Text().setRequired(true),
		timestamp: new FieldTypes.DateTime().setRequired(true),
		progress: new FieldTypes.Float(),
	};

	defaultPolicy = new Policies.Super();

	policies = {
		show: new Policies.SameAsForResourceInField({
			action_name: "show",
			collection_name: "long_running_process_events",
			field: "process",
		}),
	};
}
