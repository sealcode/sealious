module.exports = {
	password_reset_email_subject: (app_name: any) =>
		`[${app_name}] Password reset request`,
	password_reset_email_text: ([app_name, username]: [string, string]) =>
		`Hello, ${username}. Someone requested a password reset on your account on ${app_name}. If it was you, use the link below to change the password. Otherwise, ignore this message.`,
	password_reset_cta: () => "Change password",
	password_reset_input_cta: (email_address: any) =>
		`Enter the new password for ${email_address}`,
	reveal_password: () => "Reveal password",
	registration_intent_email_subject: (app_name: any) =>
		`Finish creating your ${app_name} account`,
	registration_intent_email_text: () =>
		`To finish setting up your account, click the following link:`,
	registration_intent_cta: () => `Create an account`,
	registration_intent_form_description: () =>
		`Please fill in the details of your account`,
	password: () => `password`,
	invalid_boolean: (value: any) => `Value '${value}' is not boolean format.`,
	invalid_context: () =>
		`Provided value is not an instance of Sealious.Context.`,
	invalid_update: () => `You cannot change a previously set value.`,
	invalid_image: () => `Only image files are allowed.`,
	invalid_email: (value: string) => `${value} is a not valid e-mail address.`,
	invalid_non_existing_value: (
		collection: string,
		field: string,
		value: string
	) =>
		`Collection ${collection} already has a record with '${field}' set to '${value}'.`,
	invalid_date: (value: string) =>
		`Value '${value}' is not date calendar format. Expected value in standard IS0 8601 (YYYY-MM-DD) format.`,
	invalid_single_reference: (collection: string) =>
		`You don't have access to specified resource from collection '${collection}' or it's absent.`,
	invalid_password: (length: number) =>
		`Password must have at least ${length} characters.`,
	invalid_float: (value: number) =>
		`Value '${value}' is not a float number format.`,
	invalid_existing_value: ([collection, field, value]: [
		string,
		string,
		any
	]) => `No ${collection} with ${field} set to ${value}.`,
	invalid_username: (value: string) =>
		`'${value}' is a reserved keyword. Please pick another username.`,
	username_taken: () => `Username already taken.`,
	invalid_text: ([value, value_type]: [any, any]) =>
		`Type of ${value} is ${value_type}, not string.`,
	too_short_text: ([value, length]: [string, number]) =>
		`Text '${value}' is too short, minimum length is ${length} chars.`,
	too_long_text: ([value, length]: [string, number]) =>
		`Text '${value}' has exceeded max length of ${length} chars.`,
	invalid_enum: (allowed_values: string) =>
		`Allowed values: ${allowed_values}`,
	invalid_file_id: () => `File of given ID does not exist.`,
	invalid_json_value: (value: any) =>
		`Value ${value} cannot be represented as JSON object.`,
	invalid_json_object: () => `Value is not an object.`,
	read_only_field: () => `This is a read-only field.`,
	invalid_file_storage: () =>
		`This value should e a file upload or an instance of the File object.`,
	invalid_datetime: (value: number | string) =>
		`Value '${value}' is not datetime format. Only timestamps are accepted.`,
	invalid_color: () => `Couldn't parse the color.`,
	invalid_integer: (value: any) =>
		`Value '${value}' is not a int number format.`,
	too_small_integer: ([value, min]: [number, number]) =>
		`Value ${value} should be larger than or equal to ${min}.`,
	too_big_integer: ([value, max]: [number, number]) =>
		`Value ${value} should be smaller than or equal to ${max}.`,
	policy_if_allow: (filter_name: string) =>
		`Item passes '${filter_name}' filter.`,
	policy_public_allow: () => `Everyone is allowed.`,
	policy_themselves_allow: () => `You are the user in question.`,
	policy_themselves_deny: (user_id: string) =>
		`You are not the user of ID '${user_id}'.`,
	policy_roles_allow: (roles: string) =>
		`You have one of the roles: ${roles}.`,
	policy_roles_deny: (roles: string) =>
		`You don't have any of the roles: ${roles}.`,
	policy_logged_in_allow: () => `You are logged in.`,
	policy_logged_in_deny: () => `You are not logged in.`,
	policy_owner_allow: () => `You have created this item.`,
	policy_owner_deny: () => `You are not who created this item.`,
	policy_not_allow: (reason: string) => `It's not true that '${reason}'.`,
	policy_super_allow: () => `This method was ran with a supercontext.`,
	policy_super_deny: () => `This method was not ran with a supercontext.`,
	policy_users_who_can_allow: ([action, collection]: [string, string]) =>
		`You can run action '${action}' on collection '${collection}'.`,
	policy_users_who_can_deny: ([action, collection, reason]: [
		string,
		string,
		string?
	]) => `You can't ${action} ${collection} - because '${reason}'.`,
	policy_allow: () => `Super-context is always allowed.`,
	policy_user_referenced_in_field_allow: (field: string) =>
		`You are the user mentioned in field '${field}'`,
	policy_user_referenced_in_field_deny: (field: string) =>
		`You are not the user mentioned in field ${field}.`,
	policy_noone_deny: () => `Noone is allowed.`,
};
