const COLLECTION_NAME = "_metadata";

module.exports = app => ({
	db_collection_name: COLLECTION_NAME,
	async get(key) {
		const matches = await app.Datastore.find(COLLECTION_NAME, { key });
		if (matches.length) {
			return matches[0].value;
		} else {
			undefined;
		}
	},
	async set(key, value) {
		const matches = await app.Datastore.find(COLLECTION_NAME, { key });
		if (matches.length) {
			await app.Datastore.update(
				COLLECTION_NAME,
				{ key: key },
				{ $set: { value: value } }
			);
		} else {
			await app.Datastore.insert(COLLECTION_NAME, { key, value });
		}
	},
});
