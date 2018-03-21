module.exports = {
	password_reset_email_subject: app_name =>
		`[${app_name}] Password reset request`,
	password_reset_email_text: ([app_name, username]) =>
		`Hello, ${username}. Someone requested a password reset on your account on ${app_name}. If it was you, use the link below to change the password. Otherwise, ignore this message.`,
	password_reset_cta: () => "Change password",
	password_reset_input_cta: email_address =>
		`Enter the new password for ${email_address}`,
	reveal_password: () => "Reveal password",
	registration_intent_email_subject: app_name =>
		`Finish creating your ${app_name} account`,
	registration_intent_email_text: () =>
		`To finish setting up your account, click the following link:`,
	registration_intent_cta: () => `Create an account`,
	registration_intent_form_description: () =>
		`Please fill in the details of your account`,
};
