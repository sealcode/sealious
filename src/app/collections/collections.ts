import { default as FormattedImages } from "./formatted-images";
import { default as PasswordResetIntents } from "./password-reset-intents";
import { default as RegistrationIntents } from "./registration-intents";
import { default as Sessions } from "./sessions";
import { default as UserRoles } from "./user-roles";
import { default as Users } from "./users";

const Collections = {
	"formatted-images": FormattedImages,
	users: Users,
	"password-reset-intents": PasswordResetIntents,
	"registration-intents": RegistrationIntents,
	sessions: Sessions,
	"user-roles": UserRoles,
};

export default Collections;
