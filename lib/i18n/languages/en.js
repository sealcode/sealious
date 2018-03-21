module.exports = {
	password_reset_email_subject: app_name =>
		`[${app_name}] Password reset request`,
	password_reset_email_text: ([app_name, username]) =>
		`Hello, ${username}. Someone requested a password reset on your account on ${app_name}. If it was you, use the link below to change the password. Otherwise, ignore this message.`,
	password_reset_cta: () => "Change password",
	password_reset_input_cta: email_address =>
		`Enter the new password for ${email_address}`,
	reveal_password: () => "Reveal password",
};
