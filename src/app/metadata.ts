import type { App } from "../main.js";

export const METADATA_COLLECTION_NAME = "_metadata";

export default class Metadata {
	db_collection_name = METADATA_COLLECTION_NAME;
	app: App;
	constructor(app: App) {
		this.app = app;
	}

	async get(key: string | number) {
		const matches = await this.app.Datastore.find(
			METADATA_COLLECTION_NAME,
			{ key }
		);
		if (matches.length) {
			return matches[0].value;
		} else {
			return undefined;
		}
	}

	async set(key: string, value: string | number) {
		const matches = await this.app.Datastore.find(
			METADATA_COLLECTION_NAME,
			{ key }
		);
		if (matches.length) {
			await this.app.Datastore.update(
				METADATA_COLLECTION_NAME,
				{ key: key },
				{ $set: { value: value } }
			);
		} else {
			await this.app.Datastore.insert(METADATA_COLLECTION_NAME, {
				key,
				value,
			});
		}
	}

	async clear() {
		return this.app.Datastore.remove(METADATA_COLLECTION_NAME, {}, false);
	}
}
