import LongRunningProcessEvents from "./long-running-process-events";
import LongRunningProcesses from "./long-running-processes";
import { default as Sessions } from "./sessions";
import { default as Users } from "./users";

const Collections = {
	users: new Users(),
	sessions: new Sessions(),
	long_running_processes: new LongRunningProcesses(),
	long_running_process_events: new LongRunningProcessEvents(),
};
export default Collections;
