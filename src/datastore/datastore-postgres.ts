import type {
	DeleteResult,
	Document,
	InsertOneResult,
	Collection as MongoCollection,
	UpdateResult,
} from "mongodb";
import pg from "pg";
import type { App, Config, Field } from "../main.js";
import asyncForEach from "../utils/async-foreach.js";
import Datastore from "./datastore-abstract.js";
import type { OutputOptions } from "./datastore.js";
import PostgresClient from "./postgres-client.js";
import type { QueryStage } from "./query-stage.js";

export type PostgresConfig = Config["datastore_postgres"];

export default class PostgresDatastore extends Datastore {
	client: PostgresClient;

	async start(): Promise<void> {
		const config = this.app.ConfigManager.get(
			"datastore_postgres"
		) as PostgresConfig;

		await this.checkForDatabase(config);

		if (!config) {
			throw new Error("Missing datastore_postgres config");
		}

		this.client = new PostgresClient({
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

	getClient() {
		return this.client;
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
				const fields = Object.values(
					collection.fields as Record<string, Field<any, any, any>>
				).filter((field) =>
					field.getPostgreSqlShouldFieldBeCreatedInitially()
				);
				const fieldDefs = [
					'"id" VARCHAR(255) PRIMARY KEY',
					...fields.flatMap((field) =>
						field.getPostgreSqlFieldDefinitions()
					),
				];
				const sql = `CREATE TABLE IF NOT EXISTS ${
					collection.name
				} (\n ${fieldDefs.join(",\n")} \n)`;
				await this.client.executeQuery(this.app, sql);
			}
		);
		await asyncForEach(
			Object.values(this.app.collections),
			async (collection) => {
				const fields = Object.values(
					collection.fields as Record<string, Field<any, any, any>>
				).filter(
					(field) =>
						!field.getPostgreSqlShouldFieldBeCreatedInitially()
				);

				for (const field of fields) {
					const fieldDefs = field.getPostgreSqlFieldDefinitions();
					const constraintDefs =
						field.getPostgreSqlConstraintFieldDefinitions();

					const columnsDeclarations = fieldDefs.map(
						(fieldDef) =>
							`ALTER TABLE ${collection.name} ADD COLUMN IF NOT EXISTS ${fieldDef};`
					);
					const constraintDeclarations: [string, string][] =
						constraintDefs.map((conDef) => [
							`SELECT COUNT(*) FROM pg_constraint WHERE conname='fk_${field.name}';`,
							`ALTER TABLE ${collection.name} ADD CONSTRAINT ${conDef};`,
						]);

					if (columnsDeclarations.length) {
						await Promise.all(
							columnsDeclarations.map((colD) =>
								this.client.executeQuery(this.app, colD)
							)
						);
						await Promise.all(
							constraintDeclarations.map(
								async ([checkQuery, createQuery]) => {
									const checkQuerRes =
										await this.client.executeQuery(
											this.app,
											checkQuery
										);
									const constraintExists = Number(checkQuerRes.rows[0]?.count) > 0;
									if (!constraintExists) {
										return this.client.executeQuery(
											this.app,
											createQuery
										);
									}
								}
							)
						);
					}
				}
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
		app: App,
		config: PostgresConfig,
		query: string
	): Promise<pg.QueryResult<any>> {
		if (!config) {
			throw new Error("Missing datastore_postgres config");
		}

		const tmpClient = new PostgresClient({
			password: config.password,
			user: config.username,
			host: config.host,
			port: config.port,
		});
		await tmpClient.connect();
		const res = await tmpClient.executeQuery(app, query);
		await tmpClient.end();

		return res;
	}

	private async checkForDatabase(config: PostgresConfig) {
		if (!config) {
			throw new Error("Missing datastore_postgres config");
		}

		const tmpClient = new PostgresClient({
			password: config.password,
			user: config.username,
			host: config.host,
			port: config.port,
		});
		await tmpClient.connect();
		const res = await tmpClient.executeQuery(
			this.app,
			`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${config.db_name}'`
		);

		if (res.rowCount === 0) {
			await tmpClient.executeQuery(
				this.app,
				`CREATE DATABASE "${config.db_name}";`
			);
		}

		await tmpClient.end();
	}
}
