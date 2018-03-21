const SimpleTemplate = require("./simple");

module.exports = async function RegistrationIntent(
	app,
	{ email_address, token }
) {
	return SimpleTemplate(app, {
		subject: app.i18n("registration_intent_email_subject", app.manifest.name),
		to: email_address,
		text: `
         ${app.i18n("registration_intent_email_text", [app.manifest.name])}`,
		buttons: [
			{
				text: app.i18n("registration_intent_cta"),
				href: `${
					app.manifest.base_url
				}/account-creation-details?token=${token}&email=${email_address}`,
			},
		],
	});
};
