import { MongoClient, Db, Collection as MongoCollection } from "mongodb";
import { App } from "../main";
import Collection from "../chip-types/collection";
import { QueryStage } from "./query";

export type OutputOptions = { sort?: any; skip?: number; amount?: number };

export default class Datastore {
	client: MongoClient;
	db: Db;
	constructor(public app: App) {
		this.app = app;
	}
	async start() {
		const config = this.app.ConfigManager.get("datastore_mongo") as {
			host: string;
			port: number;
			db_name: string;
		};

		const url = `mongodb://${config.host}:${config.port}/${config.db_name}`;

		this.client = await MongoClient.connect(url, { useNewUrlParser: true });

		if (!this.client) {
			return Promise.reject(
				"MongoDB was not found, please make sure it's installed. Check https://docs.mongodb.org/manual/tutorial/ for more info."
			);
		}

		this.db = this.client.db(config.db_name);
		return this.post_start();
	}
	async post_start() {
		for (let collection of Object.values(this.app.collections)) {
			await this.create_index(collection);
		}
	}
	async create_index(collection: Collection) {
		const indexes: { [field: string]: number }[] = [];
		const text_index: { [field: string]: "text" } = {};
		for (const field_name in collection.fields) {
			const index_answer = collection.fields[field_name].hasIndex();
			if (index_answer === false) {
				continue;
			}
			if (index_answer === "text") {
				text_index[field_name] = "text";
			} else if (typeof index_answer === "boolean" && index_answer) {
				indexes.push({ [field_name]: 1 });
			} else if (Array.isArray(index_answer)) {
				for (const [subfield, index] of index_answer) {
					const key = `${field_name}.${subfield}`;
					if (index === "text") {
						text_index[key] = "text";
					} else if (index) {
						indexes.push({ [key]: 1 });
					}
				}
			}
		}

		const db_collection = this.db.collection(collection.name);
		for (const index of [
			...indexes,
			...(Object.keys(text_index).length ? [text_index] : []),
		]) {
			await this.createIndex(collection.name, index).catch(
				async (error: Error & { code?: number; message: string }) => {
					if (error && error.code === 85) {
						const index_name = (error.message.match(
							/name: \"([^\"]+)\"/g
						) as string[])[1]
							.replace('name: "', "")
							.replace('"', "");
						await db_collection.dropIndex(index_name);
						return this.createIndex(collection.name, index);
					}
					throw error;
				}
			);
		}
	}

	find(
		collection_name: string,
		query: any,
		options: Parameters<MongoCollection["find"]>[1] = {},
		output_options: OutputOptions = {}
	) {
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
	aggregate(
		collection_name: string,
		pipeline: QueryStage[],
		_ = {},
		output_options: OutputOptions = {}
	) {
		const cursor = this.db.collection(collection_name).aggregate(pipeline);

		this.app.Logger.debug(
			"aggregate!",
			collection_name,
			JSON.stringify(pipeline, null, "  "),
			output_options
		);
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
	async insert(
		collection_name: string,
		to_insert: any,
		options?: Parameters<MongoCollection["insertOne"]>[1]
	) {
		this.app.Logger.debug("db.insert", ...arguments);
		const result = await this.db
			.collection(collection_name)
			.insertOne(to_insert, options);
		return result.ops[0];
	}
	update(collection_name: string, query: any, new_value: any) {
		// console.log("update", collection_name, query, new_value);
		query = process_query(query);
		return this.db.collection(collection_name).updateOne(query, new_value);
	}
	async remove(collection_name: string, query: any, just_one: boolean) {
		query = process_query(query);
		const method = just_one ? "deleteOne" : "deleteMany";
		return this.db.collection(collection_name)[method](query);
	}
	createIndex(
		collection_name: string,
		index: any,
		options?: Parameters<MongoCollection["createIndex"]>[1]
	) {
		const collection = this.db.collection(collection_name);
		return collection.createIndex(index, options);
	}
	stop() {
		this.client?.close();
	}
}

function process_query(query: any) {
	if (!query) {
		return {};
	}
	const new_query: { [key: string]: any } = {};
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
