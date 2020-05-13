const { MongoClient } = require("mongodb");
const merge = require("merge");

export default class Datastore {
	constructor(declaration) {
		this.name = declaration.name;
		this.longid = `datastore.${this.name}`;
		this.db = null;
		this.client = null;
	}
	async start(App) {
		const config = App.ConfigManager.get("datastore_mongo");

		const url = `mongodb://${config.host}:${config.port}/${config.db_name}`;

		this.client = await MongoClient.connect(url, { useNewUrlParser: true });

		if (!this.client) {
			return Promise.reject(
				"MongoDB was not found, please make sure it's installed. Check https://docs.mongodb.org/manual/tutorial/ for more info."
			);
		}

		this.db = this.client.db(config.db_name);
		return this.post_start(App);
	}
	async post_start(App) {
		const collection_names = App.ChipManager.get_all_collections();
		const collections = collection_names.map((name) =>
			App.ChipManager.get_chip("collection", name)
		);

		for (let collection of collections) {
			await this.create_index(collection);
		}
	}
	async create_index(collection) {
		let indexes = [["sealious_id", 1]];
		for (const field_name in collection.fields) {
			indexes.push([
				field_name,
				await collection.fields[field_name].has_index(),
			]);
		}
		const db_collection = this.db.collection(collection.name);

		const all_indexes = indexes
			.filter((e) => e[1] !== false)
			.map((index) => {
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
			.filter((e) => e[1] !== "text")
			.map((e) => {
				return { [e[0]]: e[1] };
			});

		// if multiple fields take part in full text search, we need to combine them into a single index.

		let text_indexes = [
			all_indexes
				.filter((e) => e[1] === "text")
				.reduce((a, b) => merge(true, a, { [b[0]]: b[1] }), {}),
		];
		if (Object.keys(text_indexes[0]).length == 0) {
			text_indexes = [];
		}

		const merged_indexes = text_indexes.concat(non_text_indexes);

		for (const index of merged_indexes) {
			await createIndex(db_collection, index).catch(
				(e) => e.code === 85,
				(error) => {
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
	find(collection_name, query, options, output_options) {
		options = options || {};
		output_options = output_options || {};
		const cursor = this.db.collection(collection_name).find(query, options);
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
	}
	aggregate(collection_name, pipeline, options, output_options) {
		options = options || {};
		output_options = output_options || {};
		const cursor = this.db.collection(collection_name).aggregate(pipeline);

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
	}
	insert(collection_name, to_insert, options) {
		return this.db
			.collection(collection_name)
			.insertOne(to_insert, options)
			.then(function (result) {
				return result.ops[0];
			});
	}
	update(collection_name, query, new_value) {
		query = process_query(query);
		return this.db.collection(collection_name).updateOne(query, new_value);
	}
	remove(collection_name, query, just_one) {
		query = process_query(query);
		const method = just_one ? "deleteOne" : "deleteMany";
		return this.db.collection(collection_name)[method](query);
	}
	createIndex(collection_name, index, options) {
		const collection = this.db.collection(collection_name);
		return collection.createIndex(index, options);
	}
	stop() {
		this.client.close();
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
			continue;
		}
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
	return new_query;
}

function createIndex(db_collection, index) {
	return db_collection.createIndex(index, { background: true });
}
