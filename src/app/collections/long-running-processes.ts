import Collection from "../../chip-types/collection.js";
import { FieldTypes, Policies } from "../../main.js";
import Matches from "../base-chips/special_filters/matches.js";

export default class LongRunningProcesses extends Collection {
	name = "long_running_processes";
	named_filters = {
		access_mode_is_user: new Matches("long_running_processes", {
			access_mode: "user",
		}),
	};

	internal = true;

	fields = {
		started: new FieldTypes.DateTime(),
		name: new FieldTypes.Text(),
		owner: new FieldTypes.SingleReference("users"),
		events: new FieldTypes.ReverseSingleReference({
			referencing_field: "process",
			referencing_collection: "long_running_process_events",
		}),
		state: new FieldTypes.Enum(["running", "finished", "error"]),
		access_mode: new FieldTypes.Enum(["user", "super"]),
	};

	defaultPolicy = new Policies.If(
		"long_running_processes",
		"access_mode_is_user",
		new Policies.UserReferencedInField("owner"),
		new Policies.Super()
	);
}
