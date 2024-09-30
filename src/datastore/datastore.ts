import { MongoClient, Db, Collection as MongoCollection } from "mongodb";
import type { App, Config } from "../main.js";
import type Collection from "../chip-types/collection.js";
import type { QueryStage } from "./query.js";
import asyncForEach from "../utils/async-foreach.js";
import QueryStep from "./query-step.js";
import { sleep } from "../test_utils/sleep.js";

export type OutputOptions = Partial<{
	skip: number;
	amount: number;
	sort: { [field_name: string]: -1 | 1 };
}>;

export default class Datastore {
	client: MongoClient;
	db: Db;
	constructor(public app: App) {
		this.app = app;
	}
	async start(): Promise<void> {
		const config = this.app.ConfigManager.get(
			"datastore_mongo"
		) as Config["datastore_mongo"];

		const url = `mongodb://${
			config.username
				? `${
						config.username +
						(config.password ? ":" + config.password : "") +
						"@"
				  }`
				: ""
		}${config.host}:${config.port}/${config.db_name}`;

		this.client = await MongoClient.connect(url, {
			connectTimeoutMS: 1000,
			serverSelectionTimeoutMS: 2000,
			authSource: config.authSource || undefined,
		}).catch((error: Error) => {
			if (error?.name === "MongoServerSelectionError") {
				const err = `MongoDB was not found at the following address: ${url}. Please make sure database is running.`;
				console.log(err);
				throw Error(err);
			}
			throw error;
		});

		if (!this.client) {
			return Promise.reject(
				"MongoDB was not found, please make sure it's installed. Check https://docs.mongodb.org/manual/tutorial/ for more info."
			);
		}

		this.db = this.client.db(config.db_name);
		await this.post_start();
	}

	async post_start(): Promise<void> {
		await asyncForEach(Object.values(this.app.collections), (collection) =>
			this.create_index(collection)
		);
	}

	async create_index(collection: Collection): Promise<void> {
		const indexes: { [field: string]: number }[] = [];
		const text_index: { [field: string]: "text" } = {};
		for (const field_name in collection.fields) {
			const index_answer = await collection.fields[field_name].hasIndex();
			if (index_answer === false) {
				continue;
			}
			if (index_answer === "text") {
				text_index[field_name] = "text";
			} else if (typeof index_answer === "boolean" && index_answer) {
				indexes.push({ [field_name]: 1 });
			} else if (typeof index_answer === "object") {
				for (const [subfield, index] of Object.entries(index_answer)) {
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
		await asyncForEach(
			[
				...indexes,
				...(Object.keys(text_index).length ? [text_index] : []),
			],
			async (index) => {
				await this.createIndex(collection.name, index).catch(
					async (
						error: Error & { code?: number; message: string }
					) => {
						if (error && error.code === 85) {
							const index_name = (
								error.message.match(
									/name: "([^"]+)"/g
								) as string[]
							)[1]
								.replace('name: "', "")
								.replace('"', "");
							await db_collection.dropIndex(index_name);
							return this.createIndex(collection.name, index);
						}
						throw error;
					}
				);
			}
		);
	}

	find(
		collection_name: string,
		query: Record<string, any>,
		options: Parameters<MongoCollection["find"]>[1] = {},
		output_options: OutputOptions = {}
	): Promise<Record<string, unknown>[]> {
		this.app.Logger.debug2(
			"DB",
			"find " + collection_name,
			{
				query,
				options,
			},
			null
		);
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

	async aggregate(
		collection_name: string,
		pipeline: QueryStage[],
		_ = {},
		output_options: OutputOptions = {}
	): Promise<Record<string, any>[]> {
		// useful for demonstration purposes
		const artificial_delay = parseInt(process.env.SEALIOUS_DB_DELAY || "0");
		if (artificial_delay) {
			await sleep(artificial_delay);
		}
		const start_timestamp = Date.now();
		const cursor = this.db.collection(collection_name).aggregate(pipeline);

		if (pipeline.find((element) => element instanceof QueryStep)) {
			throw new Error(
				"Pipeline elements should be simple objects, not QuerySteps. Perhaps you should use .toPipeline()?"
			);
		}
		this.app.Logger.debug2(
			"DB",
			"Running aggregate",
			{
				collection_name,
				pipeline,
				output_options,
			},
			null
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
		const ret = await cursor.toArray();
		const duration = Date.now() - start_timestamp;
		this.app.Logger.debug3(
			"DB",
			`Aggregate on collection ${collection_name} took ${duration}ms and returned`,
			ret
		);
		return ret as Record<string, any>[];
	}

	async insert(
		collection_name: string,
		to_insert: Record<string, any>,
		options?: Parameters<MongoCollection["insertOne"]>[1]
	) {
		this.app.Logger.debug2("DB", "Running insert", {
			collection_name,
			to_insert,
			options,
		});
		const result = await this.db
			.collection(collection_name)
			.insertOne(to_insert, options);
		return result;
	}

	update(collection_name: string, query: any, new_value: any) {
		this.app.Logger.debug2(
			"DB",
			"Update",
			{
				collection_name,
				query: query as unknown,
				new_value: new_value as unknown,
			},
			4
		);
		query = process_query(query);
		return this.db.collection(collection_name).updateOne(query, new_value);
	}
	async remove(collection_name: string, query: any, just_one: boolean) {
		this.app.Logger.debug2(
			"DB",
			"remove",
			{
				collection_name,
				query: query as unknown,
			},
			3
		);
		query = process_query(query);
		const method = just_one ? "deleteOne" : "deleteMany";
		const ret = await this.db.collection(collection_name)[method](query);
		return ret;
	}
	createIndex(
		collection_name: string,
		index: any,
		options?: Parameters<MongoCollection["createIndex"]>[1]
	) {
		const collection = this.db.collection(collection_name);
		return collection.createIndex(index, options);
	}
	async stop() {
		return this.client?.close();
	}
}

function process_query(query: Record<string, unknown>) {
	if (!query) {
		return {};
	}
	const new_query: Record<string, unknown> = {};
	for (const attribute_name in query) {
		const value = query[attribute_name];
		if (attribute_name == "id") {
			new_query[attribute_name] = value;
			continue;
		}
		if (typeof value === "object") {
			if (attribute_name[0] === "$") {
				new_query[attribute_name] = value;
			} else {
				for (const i in value) {
					new_query[attribute_name + "." + i] = (
						value as Record<string, any>
					)[i];
				}
			}
		} else {
			new_query[attribute_name] = query[attribute_name];
		}
	}
	return new_query;
}
