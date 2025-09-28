export const translations = {
	password_reset_email_subject: (app_name: string): string =>
		`[${app_name}] Password reset request`,
	password_reset_email_text: ([app_name, username]: [
		string,
		string,
	]): string =>
		`Hello, ${username}. Someone requested a password reset on your account on ${app_name}. If it was you, use the link below to change the password. Otherwise, ignore this message.`,
	password_reset_cta: (): string => "Change password",
	password_reset_input_cta: (email_address: string): string =>
		`Enter the new password for ${email_address}`,
	reveal_password: (): string => "Reveal password",
	registration_intent_email_subject: (app_name: string): string =>
		`Finish creating your ${app_name} account`,
	registration_intent_email_text: (): string =>
		`To finish setting up your account, click the following link:`,
	registration_intent_cta: (): string => `Create an account`,
	registration_intent_form_description: (): string =>
		`Please fill in the details of your account`,
	password: (): string => `password`,
	invalid_boolean: (value: string): string =>
		`Value '${value}' is not boolean format.`,
	invalid_context: (): string =>
		`Provided value is not an instance of Sealious.Context.`,
	invalid_update: (): string => `You cannot change a previously set value.`,
	invalid_image: (): string => `Only image files are allowed.`,
	invalid_email: (value: string): string =>
		`${value} is a not valid e-mail address.`,
	invalid_non_existing_value: (
		collection: string,
		field: string,
		value: string
	): string =>
		`Collection ${collection} already has a record with '${field}' set to '${value}'.`,
	invalid_date: (value: string): string =>
		`Value '${value}' is not date calendar format. Expected value in standard IS0 8601 (YYYY-MM-DD) format.`,
	invalid_single_reference: (collection: string): string =>
		`You don't have access to specified resource from collection '${collection}' or it's absent.`,
	invalid_password: (length: number): string =>
		`Password must have at least ${length} characters.`,
	invalid_float: (value: number): string =>
		`Value '${value}' is not a float number format.`,
	invalid_existing_value: (
		collection: string,
		field: string,
		value: string
	): string => `No ${collection} with ${field} set to ${value}.`,
	invalid_username: (value: string): string =>
		`'${value}' is a reserved keyword. Please pick another username.`,
	username_taken: (): string => `Username already taken.`,
	invalid_text: (value: string, value_type: string): string =>
		`Type of ${value} is ${value_type}, not string.`,
	too_short_text: (value: string, length: number): string =>
		`Text '${value}' is too short, minimum length is ${length} chars.`,
	too_long_text: (value: string, length: number): string =>
		`Text '${value}' has exceeded max length of ${length} chars.`,
	invalid_enum: (allowed_values: string): string =>
		`Allowed values: ${allowed_values}`,
	invalid_file_id: (): string => `File of given ID does not exist.`,
	invalid_json_value: (value: string): string =>
		`Value ${value} cannot be represented as JSON object.`,
	invalid_json_object: (): string => `Value is not an object.`,
	read_only_field: (): string => `This is a read-only field.`,
	invalid_file_storage: (): string =>
		`This value should be a file upload or an instance of the File object.`,
	invalid_datetime: (value: number | string): string =>
		`Value '${value}' is not datetime format. Only timestamps are accepted.`,
	invalid_color: (): string => `Couldn't parse the color.`,
	invalid_integer: (value: string): string =>
		`Value '${value}' is not a int number format.`,
	too_small_integer: (value: string, min: number): string =>
		`Value ${value} should be larger than or equal to ${min}.`,
	too_big_integer: (value: string, max: number): string =>
		`Value ${value} should be smaller than or equal to ${max}.`,
	policy_if_allow: (filter_name: string): string =>
		`Item passes '${filter_name}' filter.`,
	policy_public_allow: (): string => `Everyone is allowed.`,
	policy_roles_allow: (roles: string): string =>
		`You have one of the roles: ${roles}.`,
	policy_roles_deny: (roles: string): string =>
		`You don't have any of the roles: ${roles}.`,
	policy_logged_in_allow: (): string => `You are logged in.`,
	policy_logged_in_deny: (): string => `You are not logged in.`,
	policy_owner_allow: (): string => `You have created this item.`,
	policy_not_allow: (reason: string): string =>
		`It's not true that '${reason}'. `,
	policy_super_allow: (): string =>
		`This method was ran with a supercontext.`,
	policy_super_deny: (): string =>
		`This method was not ran with a supercontext.`,
	policy_users_who_can_allow: (action: string, collection: string): string =>
		`You can run action '${action}' on collection '${collection}'.`,
	policy_users_who_can_deny: (
		action: string,
		collection: string,
		reason: string
	): string => `You can't ${action} ${collection} - because '${reason}'.`,
	policy_allow: (): string => `Super-context is always allowed.`,
	policy_noone_deny: (): string => `Noone is allowed.`,
	not_allowed_protocol: (protocol: string, protocols: string[]): string =>
		`Procotol ${protocol} is not accepted by this field. Allowed protocols are: [${protocols.join(
			", "
		)}]`,
};
export default translations;
