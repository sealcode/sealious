import assert from "assert";
import { Collection, FieldTypes } from "../main.js";
import { TestApp } from "../test_utils/test-app.js";
import {
	withRunningApp,
	type TestAppConstructor,
} from "../test_utils/with-test-app.js";
import PostgresDatastore from "./datastore-postgres.js";
import PostgresClient from "./postgres-client.js";

// While creating tests for database these commands might be usefull
// docker ps
// docker exec -i <CONTAINER_ID> psql - navigate trough postgres with commandline
// docker exec -i <CONTAINER_ID> psql -U postgres -c "\l" - show all databases created in postgres container
// docker exec -i <CONTAINER_ID> psql -U postgres -d sealious-test -c "\dt" - show all created tables in sealious test database
// docker exec -i <CONTAINER_ID> psql -U postgres -d sealious-test -c "\d <table_name>" - show table schema of created table in sealious test database
// docker exec -i <CONTAINER_ID> psql -U postgres -d sealious-test -c "<SQL_QUERY>" - execute single SQL command in sealious test database

describe("datastorepostgres", () => {
	it("should connect to database", async () =>
		withRunningApp(null, async ({ app }) => {
			const config = app.ConfigManager.get("datastore_postgres");

			if (!config) {
				throw new Error("No postgres config");
			}

			await PostgresDatastore.executePlainQuery(
				app,
				config,
				`DROP DATABASE IF EXISTS "${config.db_name}"`
			);
			const datastore = new PostgresDatastore(app);
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

				if (!config) {
					throw new Error("No postgres config");
				}

				await PostgresDatastore.executePlainQuery(
					app,
					config,
					`DROP DATABASE IF EXISTS "${config.db_name}"`
				);
				const datastore = new PostgresDatastore(app);
				await datastore.start();
				await datastore.stop();

				const tmpClient = new PostgresClient({
					password: config.password,
					database: config.db_name,
					user: config.username,
					host: config.host,
					port: config.port,
				});
				await tmpClient.connect();

				const [tablesListResponse, dogTableResponse] =
					await Promise.all([
						tmpClient.executeQuery(
							app,
							`SELECT * FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog') AND table_type = 'BASE TABLE'`
						),
						tmpClient.executeQuery(
							app,
							`SELECT * FROM information_schema.columns WHERE table_name = 'dogs';`
						),
					]);

				const tables = tablesListResponse.rows.map(
					(row) => row.table_name
				);
				const columns = dogTableResponse.rows.map(
					(row) => row.column_name
				);
				const dataTypes = dogTableResponse.rows.map(
					(row) => row.data_type
				);

				assert.deepEqual(
					tables.sort(),
					[
						"users",
						"sessions",
						"long_running_processes",
						"long_running_process_events",
						"dogs",
					].sort()
				);
				assert.deepEqual(
					columns.sort(),
					["age", "id", "name:original", "name:safe"].sort()
				);
				assert.ok(dataTypes.includes("integer"));
				assert.ok(dataTypes.includes("text"));

				await tmpClient.end();
			}
		));

	describe("Reference tests", () => {
		function extend(t: TestAppConstructor) {
			const A = new (class extends Collection {
				name = "A";
				fields = {
					reference_to_b: new FieldTypes.SingleReference("B"),
				};
			})();
			const B = new (class extends Collection {
				name = "B";
				fields = {
					number: new FieldTypes.Int(),
					// To check if a circular dependency doesn't break the DB creation process.
					reference_to_a: new FieldTypes.SingleReference("A"),
				};
			})();

			return class extends t {
				collections = {
					...TestApp.BaseCollections,
					A,
					B,
				};
			};
		}

		it("Should be able to join columns by single reference field", () =>
			withRunningApp(extend, async ({ app }) => {
				const config = app.ConfigManager.get("datastore_postgres");

				if (!config) {
					throw new Error("No postgres config");
				}

				await PostgresDatastore.executePlainQuery(
					app,
					config,
					`DROP DATABASE IF EXISTS "${config.db_name}"`
				);
				const datastore = new PostgresDatastore(app);
				await datastore.start();

				const response = await datastore
					.getClient()
					.executeQuery(
						app,
						"SELECT * FROM A JOIN B ON a.reference_to_b = b.id"
					);
				// We are merging two tables, and each table has a field called 'id', which is why we expect to have two occurrences.
				assert.deepEqual(
					response.fields.map((f) => f.name).sort(),
					[
						"id",
						"number",
						"reference_to_a",
						"id",
						"reference_to_b",
					].sort()
				);

				await datastore.stop();
			}));
	});
});
