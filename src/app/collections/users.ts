import { Collection, App, FieldTypes, Policies } from "../../main";

export default class Users extends Collection {
	fields = {
		username: new FieldTypes.Username(),
		email: new FieldTypes.Email(),
		password: new FieldTypes.Password(),
		roles: new FieldTypes.ReverseSingleReference({
			referencing_collection: "user-roles",
			referencing_field: "user",
		}),
	};

	policies = {
		show: new Policies.Themselves(),
	};

	async init(app: App, name: string) {
		await super.init(app, name);
		app.on("started", async () => {
			const users = await app.collections.users
				.suList()
				.filter({ email: app.manifest.admin_email })
				.fetch();
			if (users.empty) {
				app.Logger.warn(
					"ADMIN",
					`Creating an admin account for ${app.manifest.admin_email}`
				);
				return app.collections["registration-intents"].suCreate({
					email: app.manifest.admin_email,
					role: "admin",
				});
			}
		});
	}
}
