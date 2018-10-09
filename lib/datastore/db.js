const { MongoClient } = require("mongodb");
const merge = require("merge");

module.exports = function(App) {
	let db = null;
	let client = null;

	var datastore = App.createChip(App.Sealious.Datastore, {
		name: "mongo",
	});

	datastore.start = async function() {
		const self = this;
		const config = App.ConfigManager.get("datastore_mongo");

		const url = `mongodb://${config.host}:${config.port}/${config.db_name}`;

		client = await MongoClient.connect(
			url,
			{ useNewUrlParser: true }
		);

		if (!client) {
			return Promise.reject(
				"MongoDB was not found, please make sure it's installed. Check https://docs.mongodb.org/manual/tutorial/ for more info."
			);
		}

		db = client.db(config.db_name);
		return self.post_start();
	};

	datastore.post_start = async function() {
		datastore.client = db;
		const collection_names = App.ChipManager.get_all_collections();
		const collections = collection_names.map(name =>
			App.ChipManager.get_chip("collection", name)
		);

		for (let collection of collections) {
			await create_index(collection);
		}
	};

	async function create_index(collection) {
		let indexes = [["sealious_id", 1]];
		for (const field_name in collection.fields) {
			indexes.push([
				field_name,
				await collection.fields[field_name].has_index(),
			]);
		}
		const db_collection = db.collection(collection.name);

		const all_indexes = indexes
			.filter(e => e[1] !== false)
			.map(index => {
				if (index[1] instanceof Object) {
					const ret = [];
					for (const i in index[1]) {
						ret.push([index[0] + "." + i, index[1][i]]);
					}
					return ret;
				}
				return [index];
			})
			.reduce((a, b) => a.concat(b), []);

		const non_text_indexes = all_indexes
			.filter(e => e[1] !== "text")
			.map(e => {
				return { [e[0]]: e[1] };
			});

		// if multiple fields take part in full text search, we need to combine them into a single index.

		let text_indexes = [
			all_indexes
				.filter(e => e[1] === "text")
				.reduce((a, b) => merge(true, a, { [b[0]]: b[1] }), {}),
		];
		if (Object.keys(text_indexes[0]).length == 0) {
			text_indexes = [];
		}

		const merged_indexes = text_indexes.concat(non_text_indexes);

		for (const index of merged_indexes) {
			await createIndex(db_collection, index).catch(
				e => e.code === 85,
				error => {
					const index_name = error.message
						.match(/name: \"([^\"]+)\"/g)[1]
						.replace('name: "', "")
						.replace('"', "");
					return db_collection
						.dropIndex(index_name)
						.then(() => createIndex(db_collection, index));
				}
			);
		}
	}

	function process_query(query) {
		if (!query) {
			return {};
		}
		const new_query = {};
		for (const attribute_name in query) {
			if (attribute_name == "sealious_id") {
				new_query[attribute_name] = query[attribute_name];
			} else {
				if (query[attribute_name] instanceof Object) {
					if (attribute_name[0] === "$") {
						new_query[attribute_name] = query[attribute_name];
					} else {
						for (const i in query[attribute_name]) {
							new_query[attribute_name + "." + i] =
								query[attribute_name][i];
						}
					}
				} else {
					new_query[attribute_name] = query[attribute_name];
				}
			}
		}
		return new_query;
	}

	datastore.find = function(collection_name, query, options, output_options) {
		options = options || {};
		output_options = output_options || {};
		const cursor = db.collection(collection_name).find(query, options);
		if (output_options.sort) {
			cursor.sort(output_options.sort);
		}
		if (output_options.skip) {
			cursor.skip(output_options.skip);
		}
		if (output_options.amount) {
			cursor.limit(output_options.amount);
		}
		return cursor.toArray();
	};

	datastore.aggregate = function(
		collection_name,
		pipeline,
		options,
		output_options
	) {
		options = options || {};
		output_options = output_options || {};
		const cursor = db.collection(collection_name).aggregate(pipeline);

		if (output_options.sort) {
			cursor.sort(output_options.sort);
		}
		if (output_options.skip) {
			cursor.skip(output_options.skip);
		}
		if (output_options.amount) {
			cursor.limit(output_options.amount);
		}
		return cursor.toArray();
	};

	datastore.insert = function(collection_name, to_insert, options) {
		return db
			.collection(collection_name)
			.insertOne(to_insert, options)
			.then(function(result) {
				return result.ops[0];
			});
	};

	datastore.update = function(collection_name, query, new_value) {
		query = process_query(query);
		return db.collection(collection_name).updateOne(query, new_value);
	};

	datastore.remove = function(collection_name, query, just_one) {
		query = process_query(query);
		const method = just_one ? "deleteOne" : "deleteMany";
		return db.collection(collection_name)[method](query);
	};

	datastore.createIndex = function(collection_name, index, options) {
		const collection = db.collection(collection_name);
		return collection.createIndex(index, options);
	};

	datastore.stop = function() {
		client.close();
	};

	return datastore;
};

function createIndex(db_collection, index) {
	return db_collection.createIndex(index, { background: true });
}
