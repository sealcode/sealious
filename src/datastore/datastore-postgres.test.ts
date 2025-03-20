import assert from "assert";
import { Collection, FieldTypes } from "../main.js";
import { TestApp } from "../test_utils/test-app.js";
import { withRunningApp } from "../test_utils/with-test-app.js";
import PostrgresDatastore from "./datastore-postgres.js";
import pg from "pg";

describe("datastorepostgres", () => {
	it("should connect to database", async () =>
		withRunningApp(null, async ({ app }) => {
			const config = app.ConfigManager.get("datastore_postgres");

			if(!config) {
				assert.ok(false);
			}

			await PostrgresDatastore.executePlainQuery(
				config,
				`DROP DATABASE IF EXISTS "${config.db_name}"`
			);
			const datastore = new PostrgresDatastore(app);
			await datastore.start();
			await datastore.stop();
		}));

	it("should create a table from the collection when table is missing", async () =>
		withRunningApp(
			(test_app) => {
				return class extends test_app {
					collections = {
						...TestApp.BaseCollections,
						dogs: new (class extends Collection {
							fields = {
								name: new FieldTypes.Text(),
								age: new FieldTypes.Int(),
							};
						})(),
					};
				};
			},
			async ({ app }) => {
				const config = app.ConfigManager.get("datastore_postgres");

				if(!config) {
					assert.ok(false);
				}

				await PostrgresDatastore.executePlainQuery(
					config,
					`DROP DATABASE IF EXISTS "${config.db_name}"`
				);
				const datastore = new PostrgresDatastore(app);
				await datastore.start();
				await datastore.stop();

				const tmpClient = new pg.Client({
					password: config.password,
					database: config.db_name,
					user: config.username,
					host: config.host,
					port: config.port,
				});
				await tmpClient.connect();

				const [tablesListResponse, dogTableResponse] =
					await Promise.all([
						tmpClient.query(
							`SELECT * FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog') AND table_type = 'BASE TABLE'`
						),
						tmpClient.query(
							`SELECT * FROM information_schema.columns WHERE table_name = 'dogs';`
						),
					]);

				const tables = tablesListResponse.rows.map(
					(row) => row.table_name
				);
				const columns = dogTableResponse.rows.map(
					(row) => row.column_name
				);

				assert.deepEqual(tables, [
					"users",
					"sessions",
					"long_running_processes",
					"long_running_process_events",
					"dogs",
				]);
				assert.deepEqual(columns, ["name", "age"]);

				await tmpClient.end();
			}
		));
});
