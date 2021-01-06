import locreq_curry from "locreq";
const locreq = locreq_curry(__dirname);
import assert from "assert";
import Mailer from "../email/mailer";
import Emittery from "emittery";
import Datastore from "../datastore/datastore";
import Metadata from "./metadata";
import Config, { PartialConfig } from "./config";
import Manifest, { ManifestData } from "./manifest";

import BaseCollections from "./collections/base-collections";
import Logger from "./logger";
import ConfigManager from "./config-manager";
import HttpServer from "../http/http";
import Context, { SuperContext } from "../context";
import Collection from "../chip-types/collection";
import { MetadataFactory, i18nFactory } from "../main";
import Users from "./collections/users";
import UserRoles from "./collections/user-roles";
import Sessions from "./collections/sessions";
import LoggerMailer from "../email/logger-mailer";
import Router from "@koa/router";
import sessionRouter from "../http/routes/session";
import accountCreationDetails from "../http/routes/account-creation-details";
import extractContext from "../http/extract-context";
import finalizeRegistrationIntent from "../http/routes/finalize-registration-intent";
import parseBody from "../http/parse-body";
import finalizePasswordReset from "../http/routes/finalize-password-reset";
import confirmPasswordReset from "../http/routes/confirm-password-reset";
import formattedImages from "../http/routes/formatted-images";
import logo from "../http/routes/logo";
import uploaded_files from "../http/routes/uploaded-files";

const default_config = locreq("default_config.json") as Config;

export type AppEvents = "starting" | "started" | "stopping" | "stopped";

/** The heart of your, well app. It all starts with  `new App(...)` */
abstract class App {
	/** The current status of the app */
	status: "stopped" | "running" | "starting" | "stopping";
	emitter = new Emittery();

	/** The base collections including users, registration intents, etc */
	static BaseCollections = BaseCollections;

	/** The manifest assigned to this app. Stores things like the app name, domain, logo*/
	abstract manifest: ManifestData;

	/** The function that's used to generate translated versions of phrases */
	i18n: (phrase_id: string, params?: unknown) => string;

	/** ConfigManager instance. It serves the config based on default
	 * values and the config object provided to the app constructor */
	ConfigManager: ConfigManager;

	/** The {@link Logger} instance assigned to this application */
	Logger: Logger;

	/** The server that runs the REST API routing and allows to add custom routes etc */
	HTTPServer: HttpServer;

	/** The mongoDB client connected to the database specified in the app config */
	Datastore: Datastore;

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
		"user-roles": UserRoles;
		sessions: Sessions;
		[name: string]: Collection;
	};

	/** A shorthand-way to create a new SuperContext: `new app.SuperContext()`. */
	public SuperContext: new () => SuperContext;

	/** A shorthand-way to create a new context: `new app.Context()`. */
	public Context: new () => Context;

	abstract config: PartialConfig;
	public mailer: Mailer = new LoggerMailer();

	/** The app constructor.
	 *
	 * @param custom_config Specify the details, such as database
	 * address and the port to listen on. This is private information
	 * and won't be shown to user. See {@link Config}
	 *
	 * @param manifest Specify additional information, such as the
	 * URL, logo or the main color of the app. This is public
	 * information.
	 */
	constructor() {
		this.ConfigManager = new ConfigManager();

		for (const key in default_config) {
			this.ConfigManager.setDefault(
				key,
				default_config[key as keyof Config]
			);
		}

		this.status = "stopped";

		this.Logger = new Logger("error");

		this.HTTPServer = new HttpServer(this);

		this.Datastore = new Datastore(this);
		this.Metadata = new MetadataFactory(this);

		const app = this;
		/** Shorthand way to create a {@link SuperContext} */
		this.SuperContext = class extends SuperContext {
			/** This constructor does not take any parameters as the
			 * {@link App} instance is automatically filled in */
			constructor() {
				super(app);
			}
		};
		/** Shorthand way to create a {@link Context} */
		this.Context = class extends Context {
			/** This constructor does not take any parameters as the
			 * {@link App} instance is automatically filled in */
			constructor() {
				super(app);
			}
		};
	}

	/** Initializes all the collection fields, prepares all the hooks,
	 * connects to the database and starts the app, serving the REST
	 * API */
	async start(): Promise<void> {
		this.ConfigManager.setRoot(this.config);
		assert(
			this.ConfigManager.get("upload_path"),
			"'upload_path' not set in config"
		);
		this.Logger.setLevel(this.ConfigManager.get("logger").level);
		this.i18n = i18nFactory(this.manifest.default_language);
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
		this.initRouter();
		await this.HTTPServer.start();
		await this.emit("started");
		this.status = "running";
	}

	/** Stops the HTTP server, disconnects from the DB */
	async stop(): Promise<void> {
		this.status = "stopping";
		await this.emit("stopping");
		await this.HTTPServer.stop();
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
		await Promise.all(
			Object.keys(this.collections).map((collection_name) =>
				this.Datastore.remove(collection_name, {}, "just_one" && false)
			)
		);
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

	initRouter(): void {
		this.HTTPServer.router.use("/api/v1/", extractContext());
		this.HTTPServer.router.use(async (ctx, next) => {
			ctx.$app.Logger.info("REQUEST", `${ctx.method} ${ctx.url}`, {
				query: ctx.query as unknown,
				body: ctx.request.body as unknown,
			});
			await next();
		});

		this.HTTPServer.router.get(
			"/account-creation-details",
			accountCreationDetails
		);

		this.HTTPServer.router.post(
			"/finalize-registration-intent",
			parseBody(),
			finalizeRegistrationIntent
		);

		this.HTTPServer.router.post(
			"/finalize-password-reset",
			parseBody(),
			finalizePasswordReset
		);

		this.HTTPServer.router.get(
			"/confirm-password-reset",
			confirmPasswordReset
		);

		this.HTTPServer.router.use(
			"/api/v1/uploaded-files",
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
		this.HTTPServer.router.use(
			"/api/v1/collections",
			collections_router.routes(),
			collections_router.allowedMethods()
		);
		this.HTTPServer.router.use(
			"/api/v1/sessions",
			sessionRouter.routes(),
			sessionRouter.allowedMethods()
		);

		this.HTTPServer.router.get(
			"/api/v1/formatted-images/:file_id/:format/:filename",
			formattedImages
		);

		this.HTTPServer.router.get("/assets/logo", logo);
	}
}

export default App;
