import type { App } from "../main.js";

export async function databaseClear(app: App): Promise<void> {
	if (app.Datastore.db) {
		app.Logger.info("TEST APP", "Clearing the database...");
		for (const collection_name in app.collections) {
			// eslint-disable-next-line no-await-in-loop
			await app.Datastore.remove(collection_name, {}, false);
		}
		await app.Datastore.remove(app.Metadata.db_collection_name, {}, false);
	}
}
