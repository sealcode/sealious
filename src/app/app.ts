// @ts-ignore
const locreq = require("locreq")(__dirname);
import assert from "assert";
import { ActionName } from "../action";
import Mailer from "../email/mailer";
import Emittery from "emittery";
import Datastore from "../datastore/datastore";
import Metadata from "./metadata";
import { SubjectPathEquiv } from "../data-structures/subject-path";
import { PartialConfig } from "./config";
import Manifest, { ManifestData } from "./manifest";

import BaseCollections from "./collections/base-collections";
import Logger from "./logger";
import ConfigManager from "./config-manager";
import HttpServer from "../http/http";
import Subject from "../subject/subject";
import Context, { SuperContext } from "../context";
import Collection from "../chip-types/collection";
import {
	EmailFactory,
	RootSubject,
	MetadataFactory,
	i18nFactory,
} from "../main";
import Users from "./collections/users";
import UserRoles from "./collections/user-roles";
import Sessions from "./collections/sessions";

const default_config = locreq("default_config.json");

export type AppEvents = "starting" | "started" | "stopping" | "stopped";

/** The heart of your, well app. It all starts with  `new App(...)` */
abstract class App extends Emittery {
	/** The current status of the app */
	status: "stopped" | "running" | "starting" | "stopping";

	/** The base collections including users, registration intents, etc */
	static BaseCollections = BaseCollections;

	/** The manifest assigned to this app. Stores things like the app name, domain, logo*/
	abstract manifest: ManifestData;

	/** The function that's used to generate translated versions of phrases */
	i18n: (phrase_id: string, params?: any) => string;

	/** ConfigManager instance. It serves the config based on default
	 * values and the config object provided to the app constructor */
	ConfigManager: ConfigManager;

	/** The {@link Logger} instance assigned to this application */
	Logger: Logger;

	/** Mailer configured according to the app's config */
	Email: Mailer;

	/** The server that runs the REST API routing and allows to add custom routes etc */
	HTTPServer: HttpServer;

	/** The root subject of the app. It's where all subjects are derived from */
	RootSubject: Subject;

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
		super();

		this.ConfigManager = new ConfigManager();

		for (let key in default_config) {
			this.ConfigManager.setDefault(key, default_config[key]);
		}

		this.status = "stopped";

		this.Logger = new Logger("error");

		this.Email = EmailFactory(this);
		this.HTTPServer = new HttpServer(this);

		this.RootSubject = new RootSubject(this);

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
	async start() {
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

		for (const [name, collection] of Object.entries(this.collections)) {
			await collection.init(this, name);
		}

		await this.emit("starting");
		await this.Datastore.start();
		await this.Email.init();
		await this.HTTPServer.start();
		await this.emit("started");
		this.status = "running";
	}

	/** Stops the HTTP server, disconnects from the DB */
	async stop() {
		this.status = "stopping";
		await this.emit("stopping");
		await this.HTTPServer.stop();
		await this.Datastore.stop();
		this.status = "stopped";
		await this.emit("stopped");
		this.clearListeners();
		for (const collection of Object.values(this.collections)) {
			collection.clearListeners();
		}
	}

	/** Removes all data inside the app. USE WITH CAUTION
	 * @internal
	 */
	async removeAllData() {
		Object.keys(this.collections).map((collection_name) =>
			this.Datastore.remove(collection_name, {}, "just_one" && false)
		);
	}

	/** Allows to listen for basic app status change events */
	// @ts-ignore
	async on(event_name: AppEvents, callback: () => void) {
		return super.on(event_name, callback);
	}

	/** registers a collection within the app
	 * @internal
	 */
	registerCollection(collection: Collection) {
		this.collections[collection.name] = collection;
	}
}

export default App;
