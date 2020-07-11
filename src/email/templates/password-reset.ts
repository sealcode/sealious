import SimpleTemplate from "./simple";
import { App } from "../../main";
import { NotFound } from "../../response/errors";
import { CollectionResponse } from "../../../common_lib/response/responses";

export default async function PasswordResetTemplate(
	app: App,
	{ email_address, token }: { email_address: string; token: string }
) {
	const matching_users = (await app.runAction(
		new app.SuperContext(),
		["collections", "users"],
		"show",
		{ filter: { email: email_address } }
	)) as CollectionResponse;

	if (!matching_users.items.length) {
		throw new NotFound("No user with that email");
	}

	const username = matching_users.items[0].username;

	return SimpleTemplate(app, {
		subject: app.i18n("password_reset_email_subject", app.manifest.name),
		to: `${username}<${email_address}>`,
		text: `
         ${app.i18n("password_reset_email_text", [
				app.manifest.name,
				username,
			])}`,
		buttons: [
			{
				text: app.i18n("password_reset_cta"),
				href: `${app.manifest.base_url}/confirm-password-reset?token=${token}&email=${email_address}`,
			},
		],
	});
}
