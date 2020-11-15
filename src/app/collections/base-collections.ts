import { default as FormattedImages } from "./formatted-images";
import { default as PasswordResetIntents } from "./password-reset-intents";
import { default as RegistrationIntents } from "./registration-intents";
import { default as Sessions } from "./sessions";
import { default as UserRoles } from "./user-roles";
import { default as Users } from "./users";

const Collections = {
	"formatted-images": new FormattedImages(),
	users: new Users(),
	"password-reset-intents": new PasswordResetIntents(),
	"registration-intents": new RegistrationIntents(),
	sessions: new Sessions(),
	"user-roles": new UserRoles(),
};
export default Collections;
