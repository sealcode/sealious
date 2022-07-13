import type { App } from "../main";

const COLLECTION_NAME = "_metadata";

export default class Metadata {
	db_collection_name = COLLECTION_NAME;
	app: App;
	constructor(app: App) {
		this.app = app;
	}

	async get(key: string | number) {
		const matches = await this.app.Datastore.find(COLLECTION_NAME, { key });
		if (matches.length) {
			return matches[0].value;
		} else {
			undefined;
		}
	}
	async set(key: string, value: string | number) {
		const matches = await this.app.Datastore.find(COLLECTION_NAME, { key });
		if (matches.length) {
			await this.app.Datastore.update(
				COLLECTION_NAME,
				{ key: key },
				{ $set: { value: value } }
			);
		} else {
			await this.app.Datastore.insert(COLLECTION_NAME, { key, value });
		}
	}
}
