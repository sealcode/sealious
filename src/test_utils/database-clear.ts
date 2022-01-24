import { App } from "../main";

export async function databaseClear(app: App) {
	if (app.Datastore.db) {
		app.Logger.info("TEST APP", "Clearing the database...");
		for (const collection_name in app.collections) {
			// eslint-disable-next-line no-await-in-loop
			await app.Datastore.remove(
				collection_name,
				{},
				"just_one" && false
			);
		}
		await app.Datastore.remove(
			app.Metadata.db_collection_name,
			{},
			"just_one" && false
		);
	}
}
