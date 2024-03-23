import LongRunningProcessEvents from "./long-running-process-events.js";
import LongRunningProcesses from "./long-running-processes.js";
import { default as Sessions } from "./sessions.js";
import { default as Users } from "./users.js";

const Collections = {
	users: new Users(),
	sessions: new Sessions(),
	long_running_processes: new LongRunningProcesses(),
	long_running_process_events: new LongRunningProcessEvents(),
};
export default Collections;
