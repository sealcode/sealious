import pg from "pg";
import type { App } from "../app/app.js";

export default class PostgresClient extends pg.Client {
	executeQuery(app: App, q: string) {
		app.Logger.debug2("DB", "sql", q);
		return this.query(q);
	}
}
