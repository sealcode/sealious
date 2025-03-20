import type {
	DeleteResult,
	Document,
	InsertOneResult,
	Collection as MongoCollection,
	UpdateResult,
} from "mongodb";
import pg from "pg";
import type { Config } from "../main.js";
import type { OutputOptions } from "./datastore.js";
import Datastore from "./datastore-abstract.js";
import type { QueryStage } from "./query-stage.js";
import asyncForEach from "../utils/async-foreach.js";

export type PostgresConfig = Config["datastore_postgres"];

export default class PostrgresDatastore extends Datastore {
	client: pg.Client;

	async start(): Promise<void> {
		const config = this.app.ConfigManager.get(
			"datastore_postgres"
		) as PostgresConfig;

		await this.checkForDatabase(config);

		if (!config) {
			throw new Error("Missing datastore_postgres config");
		}

		this.client = new pg.Client({
			password: config.password,
			user: config.username,
			host: config.host,
			port: config.port,
			database: config.db_name,
		});
		await this.client.connect().catch((err) => {
			throw err;
		});

		await this.postStart();
	}

	async stop(): Promise<void> {
		await this.client?.end();
	}

	find(
		collection_name: string,
		query: Record<string, unknown>,
		options: Parameters<MongoCollection["find"]>[1],
		output_options: OutputOptions
	): Promise<Record<string, unknown>[]> {
		throw new Error("Method not implemented.");
	}

	aggregate(
		collection_name: string,
		pipeline: QueryStage[],
		_: unknown,
		output_options: OutputOptions
	): Promise<Record<string, unknown>[]> {
		throw new Error("Method not implemented.");
	}

	insert(
		collection_name: string,
		to_insert: Record<string, unknown>,
		options?: Parameters<MongoCollection["insertOne"]>[1]
	): Promise<InsertOneResult<Document>> {
		throw new Error("Method not implemented.");
	}

	update(
		collection_name: string,
		query: unknown,
		new_value: unknown
	): Promise<UpdateResult<Document>> {
		throw new Error("Method not implemented.");
	}

	remove(
		collection_name: string,
		query: unknown,
		just_one: boolean
	): Promise<DeleteResult> {
		throw new Error("Method not implemented.");
	}

	private async postStart() {
		await asyncForEach(
			Object.values(this.app.collections),
			async (collection) => {
				const sql = `CREATE TABLE IF NOT EXISTS ${
					collection.name
				} (\n ${Object.keys(collection.fields)
					.map((fieldName) => `"${fieldName}" JSONB`)
					.join(",\n")} \n)`;
				await this.client.query(sql);
			}
		);
	}

	/**
	 * Method is meant for testing when you need to execute single quick query
	 * to check state of the database or clean database afetr
	 * @param config config to connect to postgress (database name will be skipped)
	 * @param query SQL formatted string
	 */
	static async executePlainQuery(
		config: PostgresConfig,
		query: string
	): Promise<pg.QueryResult<any>> {
		if (!config) {
			throw new Error("Missing datastore_postgres config");
		}

		const tmpClient = new pg.Client({
			password: config.password,
			user: config.username,
			host: config.host,
			port: config.port,
		});
		await tmpClient.connect();
		const res = await tmpClient.query(query);
		await tmpClient.end();

		return res;
	}

	private async checkForDatabase(config: PostgresConfig) {
		if (!config) {
			throw new Error("Missing datastore_postgres config");
		}

		const tmpClient = new pg.Client({
			password: config.password,
			user: config.username,
			host: config.host,
			port: config.port,
		});
		await tmpClient.connect();
		const res = await tmpClient.query(
			`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${config.db_name}'`
		);

		if (res.rowCount === 0) {
			await tmpClient.query(`CREATE DATABASE "${config.db_name}";`);
		}

		await tmpClient.end();
	}
}
