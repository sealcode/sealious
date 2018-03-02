"use strict";
var Promise = require("bluebird");
var MongoClient = require("mongodb").MongoClient;
var DbsCommonPart = require("./mongo-api-abstract");

module.exports = function(App) {
	const priv = { db: null };

	var DatastoreMongo = App.createDatastore({ name: "mongo" });

	DatastoreMongo.start = function() {
		var self = this;
		var config = App.ConfigManager.get_config().datastore_mongo;

		var url = `mongodb://${config.host}:${config.port}/${config.db_name}`;
		return Promise.promisify(MongoClient.connect)(url)
			.then(function(client) {
				if (client === null) {
					return Promise.reject(
						"MongoDB was not found, please make sure it's installed. Check https://docs.mongodb.org/manual/tutorial/ for more info."
					);
				} else {
					priv.db = client.db(config.db_name);
					return self.post_start();
				}
			})
			.catch(console.error);
	};

	DbsCommonPart(App, DatastoreMongo, priv);
	return DatastoreMongo;
};
