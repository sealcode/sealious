import Collection from "../../chip-types/collection";
import { FieldTypes, Policies } from "../../main";

export default class LongRunningProcessEvents extends Collection {
	name = "long_running_process_events";

	fields = {
		process: new FieldTypes.SingleReference("long_running_processes"),
		type: new FieldTypes.Enum(["info", "error"]),
		message: new FieldTypes.Text(),
		timestamp: new FieldTypes.DateTime(),
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
