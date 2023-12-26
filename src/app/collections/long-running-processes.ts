import Collection from "../../chip-types/collection";
import { FieldTypes, Policies } from "../../main";

export default class LongRunningProcesses extends Collection {
	name = "long_running_processes";

	fields = {
		started: new FieldTypes.DateTime(),
		name: new FieldTypes.Text(),
		owner: new FieldTypes.SingleReference("users"),
		events: new FieldTypes.ReverseSingleReference({
			referencing_field: "process",
			referencing_collection: "long_running_process_events",
		}),
		state: new FieldTypes.Enum(["running", "finished", "error"]),
	};

	defaultPolicy = new Policies.Super();

	policies = {
		show: new Policies.UserReferencedInField("owner"),
	};
}
