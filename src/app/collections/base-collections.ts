import { default as FormattedImages } from "./formatted-images";
import { default as Sessions } from "./sessions";
import { default as Users } from "./users";

const Collections = {
	"formatted-images": new FormattedImages(),
	users: new Users(),
	sessions: new Sessions(),
};
export default Collections;
