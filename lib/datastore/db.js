"use strict";
var Promise = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var DbsCommonPart = require("./mongo-api-abstract");

module.exports = function(App) {
	const priv = { db: null };
	let client = null;

	var DatastoreMongo = App.createChip(App.Sealious.Datastore, {
		name: "mongo",
	});

	DatastoreMongo.start = function() {
		var self = this;
		var config = App.ConfigManager.get("datastore_mongo");

		var url = `mongodb://${config.host}:${config.port}/${config.db_name}`;
		return Promise.promisify(MongoClient.connect)(url).then(function(_client) {
			if (_client === null) {
				return Promise.reject(
					"MongoDB was not found, please make sure it's installed. Check https://docs.mongodb.org/manual/tutorial/ for more info."
				);
			} else {
				client = _client;
				priv.db = _client.db(config.db_name);
				return self.post_start();
			}
		});
	};

	DbsCommonPart(App, DatastoreMongo, priv);

	DatastoreMongo.stop = function() {
		client.close();
	};
	return DatastoreMongo;
};
