import LongRunningProcessEvents from "./long-running-process-events.js";
import LongRunningProcesses from "./long-running-processes.js";
import { default as Sessions } from "./sessions.js";
import { default as Users } from "./users.js";

const Collections = {
	users: Users,
	sessions: Sessions,
	long_running_process_events: LongRunningProcessEvents,
	long_running_processes: LongRunningProcesses,
};

export default Collections;
