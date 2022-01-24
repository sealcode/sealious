import { default as Sessions } from "./sessions";
import { default as Users } from "./users";

const Collections = {
	users: new Users(),
	sessions: new Sessions(),
};
export default Collections;
