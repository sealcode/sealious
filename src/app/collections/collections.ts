import LongRunningProcessEvents from "./long-running-process-events";
import LongRunningProcesses from "./long-running-processes";
import { default as Sessions } from "./sessions";
import { default as Users } from "./users";

const Collections = {
	users: Users,
	sessions: Sessions,
	long_running_process_events: LongRunningProcessEvents,
	long_running_processes: LongRunningProcesses,
};

export default Collections;
