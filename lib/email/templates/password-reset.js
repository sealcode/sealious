const SimpleTemplate = require("./simple");

module.exports = async function PasswordReset(app, { email_address, token }) {
	const user = (await app.run_action(
		new app.Sealious.SuperContext(),
		["collections", "users"],
		"show",
		{ filter: { email: email_address } }
	))[0];

	return SimpleTemplate(app, {
		subject: app.i18n("password_reset_email_subject", app.manifest.name),
		to: `${user.body.username}<${email_address}>`,
		text: `
         ${app.i18n("password_reset_email_text", [
						app.manifest.name,
						user.body.username,
					])}`,
		buttons: [
			{
				text: app.i18n("password_reset_cta"),
				href: `${
					app.manifest.base_url
				}/confirm-password-reset?token=${token}&email=${email_address}`,
			},
		],
	});
};
