import assert from "assert";
import { App } from "../../main";
import { BadContext } from "../../response/errors";

export default (app: App): Promise<void> =>
	app.HTTPServer.custom_route(
		"POST",
		"/finalize-password-reset",
		async (app, _, params: Record<string, unknown>) => {
			assert(params.token, "Token missing");
			assert(params.password, "Password missing");

			if (typeof params.token !== "string") {
				throw new Error("Invalid token");
			}

			if (typeof params.password !== "string") {
				throw new Error("Invalid password");
			}

			const intent_response = await app.collections[
				"password-reset-intents"
			]
				.suList()
				.filter({ token: params.token })
				.fetch();

			if (intent_response.empty) {
				throw new BadContext("Incorrect token");
			}

			const intent = intent_response.items[0];

			const user_response = await app.collections.users
				.suList()
				.filter({ email: intent.get("email") as string })
				.fetch();
			if (user_response.empty) {
				throw new Error("No user with this email address.");
			}
			user_response.items[0].set("password", params.password);
			await user_response.items[0].save(new app.SuperContext());
			await intent.remove(new app.SuperContext());
			return "Password reset successful";
		}
	);
