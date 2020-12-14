import { Collection, FieldTypes, Policies, App, Context } from "../../main";
import PasswordResetTemplate from "../../email/templates/password-reset";
import { CollectionItem } from "../../chip-types/collection-item";

export default class PasswordResetIntents extends Collection {
	name = "password-reset-intents";
	fields = {
		email: new FieldTypes.ValueExistingInCollection({
			field: "email",
			collection: "users",
			include_forbidden: true,
		}),
		token: new FieldTypes.SecretToken(),
	};
	policies = {
		create: new Policies.Public(),
		edit: new Policies.Noone(),
	};
	defaultPolicy: Policies.Super;
	async init(app: App, name: string) {
		await super.init(app, name);
		app.collections["password-reset-intents"].on(
			"after:create",
			async ([context, intent]: [
				Context,
				CollectionItem<PasswordResetIntents>,
				any
			]) => {
				const intent_as_super = await intent.fetchAs(
					new app.SuperContext()
				);
				const message = await PasswordResetTemplate(app, {
					email_address: intent.get("email"),
					token: intent_as_super.get("token"),
				});
				await message.send(app);
			}
		);
	}
}
