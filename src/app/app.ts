import Router from "@koa/router";
import type { default as Koa } from "koa";
import assert from "assert";
import Emittery from "emittery";
import fs from "fs";
import type Collection from "../chip-types/collection.js";
import Context, { SuperContext } from "../context.js";
import MongoDatastore from "../datastore/datastore.js";
import LoggerMailer from "../email/logger-mailer.js";
import type Mailer from "../email/mailer.js";
import extractContext from "../http/extract-context.js";
import logo from "../http/routes/logo.js";
import sessionRouter from "../http/routes/session.js";
import uploaded_files from "../http/routes/uploaded-files.js";
import { MetadataFactory } from "../main.js";
import { module_dirname } from "../utils/module_filename.js";
import BaseCollections from "./collections/base-collections.js";
import type LongRunningProcessEvents from "./collections/long-running-process-events.js";
import type LongRunningProcesses from "./collections/long-running-processes.js";
import type Sessions from "./collections/sessions.js";
import type Users from "./collections/users.js";
import ConfigManager from "./config-manager.js";
import type { Config } from "./config.js";
import type { PartialConfig } from "./config.js";
import Logger from "./logger.js";
import Manifest, { type ManifestData } from "./manifest.js";
import type Metadata from "./metadata.js";

import _locreq from "locreq";
import { UPLOADED_FILES_BASE_URL } from "./consts.js";
import { FileManager } from "@sealcode/file-manager";
import openApiSchema from "../http/routes/open-api-schema.js";
import type { KoaResponsiveImageRouter } from "koa-responsive-image-router";
const locreq = _locreq(module_dirname(import.meta.url));

const default_config = JSON.parse(
	await fs.promises.readFile(locreq.resolve("default_config.json"), "utf-8")
) as Config;

export type AppEvents = "starting" | "started" | "stopping" | "stopped";

export type Translation = string | ((...params: any[]) => string);

/** The heart of your, well app. It all starts with  `new App(...)` */
export abstract class App {
	/** The current status of the app */
	status: "stopped" | "running" | "starting" | "stopping";
	private emitter = new Emittery();
	public fileManager: FileManager;
	public imageRouter: KoaResponsiveImageRouter;

	/** The base collections including users, registration intents, etc */
	static BaseCollections = BaseCollections;

	/** The manifest assigned to this app. Stores things like the app name, domain, logo*/
	abstract manifest: ManifestData;

	/** ConfigManager instance. It serves the config based on default
	 * values and the config object provided to the app constructor */
	ConfigManager: ConfigManager;

	/** The {@link Logger} instance assigned to this application */
	Logger: Logger;

	/** The mongoDB client connected to the database specified in the app config */
	Datastore: MongoDatastore;

	/** The Metadata manager assigned to this app. Used to store
	 * certain state information that's not meant to be shown to the
	 * user
	 *
	 * @internal
	 */
	Metadata: Metadata;

	/** The collections defined within the given app. */
	abstract collections: {
		users: Users;
		sessions: Sessions;
		long_running_processes: LongRunningProcesses;
		long_running_process_events: LongRunningProcessEvents;
		[name: string]: Collection;
	};

	/** A shorthand-way to create a new SuperContext: `new app.SuperContext()`. */
	public SuperContext: new (
		params?: Omit<
			ConstructorParameters<typeof SuperContext<this>>[0],
			"app"
		>
	) => SuperContext<this>;

	/** A shorthand-way to create a new context: `new app.Context()`. */
	public Context: new (
		params?: Omit<ConstructorParameters<typeof Context<this>>[0], "app">
	) => Context<this>;

	abstract config: PartialConfig;
	public mailer: Mailer = new LoggerMailer();

	public translations: Record<
		string,
		| undefined
		| Record<string, string | ((...values: string[]) => string) | undefined>
	> = {};

	constructor({
		fileManager,
		imageRouter,
	}: {
		fileManager: FileManager;
		imageRouter: KoaResponsiveImageRouter;
	}) {
		this.ConfigManager = new ConfigManager();
		this.fileManager = fileManager;
		this.imageRouter = imageRouter;

		for (const key in default_config) {
			this.ConfigManager.setDefault(
				key,
				default_config[key as keyof Config]
			);
		}

		this.status = "stopped";

		this.Logger = new Logger("error");

		this.Datastore = new MongoDatastore(this);
		this.Metadata = new MetadataFactory(this);

		const app = this;
		/** Shorthand way to create a {@link SuperContext} */
		this.SuperContext = class extends SuperContext<this> {
			constructor(
				params: Omit<
					ConstructorParameters<typeof SuperContext<typeof app>>["0"],
					"app"
				> = {}
			) {
				super({ app, ...params });
			}
		};
		/** Shorthand way to create a {@link Context} */
		this.Context = class extends Context<this> {
			constructor(
				params: Omit<
					ConstructorParameters<typeof Context<typeof app>>["0"],
					"app"
				> = {}
			) {
				super({ app, ...params });
			}
		};
	}

	/** Initializes all the collection fields, prepares all the hooks,
	 * connects to the database and starts the app, serving the REST
	 * API */
	async start(): Promise<void> {
		if (this.status !== "stopped")
			throw new Error(
				`app should be on 'stopped' status (current status - '${this.status}')`
			);

		this.ConfigManager.setRoot(this.config);

		this.Logger.setLevel(this.ConfigManager.get("logger").level);
		new Manifest(this.manifest).validate();
		this.status = "starting";
		assert(
			["dev", "production"].includes(
				this.ConfigManager.get("core").environment
			),
			`"core.environment" config should be either "dev" or "production"`
		);
		const promises = [];
		for (const [name, collection] of Object.entries(this.collections)) {
			promises.push(collection.init(this, name));
		}
		await Promise.all(promises);
		await this.emitter.emit("starting");
		await this.Datastore.start();
		await this.mailer.init(this);
		await this.emit("started");
		this.status = "running";
	}

	/** Stops the HTTP server, disconnects from the DB */
	async stop(): Promise<void> {
		this.status = "stopping";
		await this.emit("stopping");
		await this.Datastore.stop();
		this.status = "stopped";
		await this.emit("stopped");
		this.emitter.clearListeners();
		for (const collection of Object.values(this.collections)) {
			collection.clearListeners();
		}
	}

	/** Removes all data inside the app. USE WITH CAUTION
	 * @internal
	 */
	async removeAllData(): Promise<void> {
		await Promise.all([
			...Object.keys(this.collections).map((collection_name) =>
				this.Datastore.remove(collection_name, {}, false)
			),
			this.Metadata.clear(),
		]);
	}

	/** Allows to listen for basic app status change events */
	on(
		event_name: AppEvents,
		callback: () => Promise<void> | void
	): Emittery.UnsubscribeFn {
		return this.emitter.on(event_name, callback);
	}

	emit(event_name: string, data?: unknown): Promise<void> {
		return this.emitter.emit(event_name, data);
	}

	/** registers a collection within the app
	 * @internal
	 */
	registerCollection(collection: Collection): void {
		this.collections[collection.name] = collection;
	}

	initRouter(router: Router): void {
		router.use("/api/v1/", extractContext(), async (ctx, next) => {
			await next();
			ctx.$app.Logger.debug("HTTP RESPONSE", "Responding with", ctx.body);
		});
		router.use(async (ctx, next) => {
			ctx.$app.Logger.info("REQUEST", `${ctx.method} ${ctx.url}`, {
				query: ctx.query as unknown,
				body: ctx.request.body as unknown,
			});
			await next();
		});

		router.use(
			UPLOADED_FILES_BASE_URL,
			uploaded_files.routes(),
			uploaded_files.allowedMethods()
		);

		const collections_router = new Router();
		for (const collection of Object.values(this.collections)) {
			const collection_router = collection.getRouter();
			collections_router.use(
				`/${collection.name
					.replace(/\(/g, "\\(")
					.replace(/\)/g, "\\)")}`, //to enable "(" and ")" in collection names (see and.subtest.ts)
				collection_router.routes(),
				collection_router.allowedMethods()
			);
		}
		router.use(
			"/api/v1/collections",
			collections_router.routes(),
			collections_router.allowedMethods()
		);
		router.use(
			"/api/v1/sessions",
			sessionRouter.routes(),
			sessionRouter.allowedMethods()
		);

		router.get("/assets/logo", logo);

		router.get("/docs/schema", openApiSchema);
	}

	async getFeedHTMLMetatags(ctx: Koa.Context): Promise<string> {
		let result = "";
		for (const collection of Object.values(this.collections)) {
			if (collection.hasFeed()) {
				result += /* HTML */ `<link
					href="/api/v1/collections/${collection.name}/feed"
					type="application/atom+xml"
					rel="alternate"
					title="${await collection.getFeedTitle(ctx)} feed"
				/>`;
			}
		}
		return result;
	}

	addTranslations(
		new_translations_per_language: Record<
			string,
			| undefined
			| Record<
					string,
					string | ((...values: string[]) => string) | undefined
			  >
		>
	) {
		for (const [language, translations] of Object.entries(
			new_translations_per_language
		)) {
			if (!this.translations[language]) {
				this.translations[language] = {};
			}
			this.translations[language] = {
				...this.translations[language],
				...translations,
			};
		}
	}
}
