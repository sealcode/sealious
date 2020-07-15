// @ts-ignore
const locreq = require("locreq")(__dirname);
import assert from "assert";
import { ActionName } from "../action";
import Mailer from "../email/mailer";
import * as Sealious from "../main";
import Emittery from "emittery";
import { runActionCurry } from "./run-action-curry";
import Datastore from "../datastore/datastore";
import Metadata from "./metadata";
import { SubjectPathEquiv } from "../data-structures/subject-path";
import { PartialConfig } from "./config";
import {
	Collection,
	Hookable,
	SuperContext,
	Context,
	i18nFactory,
} from "../main";
import { ManifestData } from "./manifest";

import Collections from "./collections/collections";
import Logger from "./logger";

const default_config = locreq("default_config.json");

export type AppEvents = "starting" | "started" | "stopping" | "stopped";

/** The heart of your, well app. It all starts with  `new App(...)` */
class App extends Hookable {
	/** The current status of the app */
	status: "stopped" | "running" | "starting" | "stopping";

	/** The manifest assigned to this app. Stores things like the app name, domain, logo*/
	manifest: Sealious.Manifest;

	/** The function that's used to generate translated versions of phrases */
	i18n: (phrase_id: string, params?: any) => string;

	/** ConfigManager instance. It serves the config based on default values and the config object provided to the app constructor */
	ConfigManager: Sealious.ConfigManager;

	/** The {@link Logger} instance assigned to this application */
	Logger: Logger;

	/** Mailer configured according to the app's config */
	Email: Mailer;

	/** The server that runs the REST API routing and allows to add custom routes etc */
	HTTPServer: Sealious.HttpServer;

	/** The root subject of the app. It's where all subjects are derived from */
	RootSubject: Sealious.Subject;

	/** Performs an action within an app. The action is specified by the subject path, parametrized with params and ran under the given context */
	runAction: (
		context: Sealious.Context,
		path: SubjectPathEquiv,
		action: ActionName,
		params?: any
	) => Promise<any>;

	/** The mongoDB client connected to the database specified in the app config */
	Datastore: Datastore;

	/** The Metadata manager assigned to this app. Used to store certain state information that's not meant to be shown to the user
	 * @internal
	 */
	Metadata: Metadata;

	/** The emittery instance used to signal app state changes, like "started" or "stopped". It's not advised to use it directly, but rather to use the {@App.on} method
	 * @internal
	 */
	private e: Emittery;

	/** The collections defined within the given app. */
	collections: { [name: string]: Collection } = {};

	/** A shorthand-way to create a new SuperContext: `new app.SuperContext()`. */
	public SuperContext: new () => SuperContext;

	/** A shorthand-way to create a new context: `new app.Context()`. */
	public Context: new () => Context;

	/** The app constructor.
	 * @param custom_config Specify the details, such as database address and the port to listen on. This is private information and won't be shown to user. See {@link Config}
	 * @param manifest Specify additional information, such as the URL, logo or the main color of the app. This is public information.
	 */
	constructor(custom_config: PartialConfig, manifest: ManifestData) {
		super();
		this.e = new Emittery();

		this.status = "stopped";
		this.manifest = new Sealious.Manifest(manifest);
		this.manifest.validate();

		this.i18n = i18nFactory(this.manifest.default_language);

		this.ConfigManager = new Sealious.ConfigManager();

		for (let key in default_config) {
			this.ConfigManager.setDefault(key, default_config[key]);
		}
		this.ConfigManager.setRoot(custom_config);

		this.Logger = new Logger();

		this.Email = Sealious.EmailFactory(this);
		this.HTTPServer = new Sealious.HttpServer(this);

		this.RootSubject = new Sealious.RootSubject(this);
		this.runAction = runActionCurry(this);

		this.Datastore = new Datastore(this);
		this.Metadata = new Sealious.MetadataFactory(this);

		assert(
			this.ConfigManager.get("upload_path"),
			"'upload_path' not set in config"
		);

		for (const collection_id in Collections) {
			//those functions call collection.fromDefinition somewhere down the road, which might prove problematic as we don't await them here
			Collections[collection_id as keyof typeof Collections](this);
		}

		const app = this;
		/** Shorthand way to create a {@link SuperContext} */
		this.SuperContext = class extends SuperContext {
			/** This constructor does not take any parameters as the {@link App} instance is automatically filled in */
			constructor() {
				super(app);
			}
		};
		/** Shorthand way to create a {@link Context} */
		this.Context = class extends Context {
			/** This constructor does not take any parameters as the {@link App} instance is automatically filled in */
			constructor() {
				super(app);
			}
		};
	}

	/** Initializes all the collection fields, prepares all the hooks, connects to the database and starts the app, serving the REST API */
	async start() {
		this.status = "starting";
		assert(
			["dev", "production"].includes(
				this.ConfigManager.get("core").environment
			),
			`"core.environment" config should be either "dev" or "production"`
		);

		for (const collection of Object.values(this.collections)) {
			await collection.init();
		}

		await this.e.emit("starting");
		await this.Datastore.start();
		await this.Email.init();
		await this.HTTPServer.start();
		await this.e.emit("started");
		this.status = "running";
		return this;
	}

	/** Stops the HTTP server, disconnects from the DB */
	async stop() {
		this.status = "stopping";
		await this.e.emit("stopping");
		await this.HTTPServer.stop();
		this.Datastore.stop();
		this.status = "stopped";
		await this.e.emit("stopped");
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
	async on(event_name: AppEvents, callback: () => void) {
		this.e.on(event_name, callback);
	}

	/** registers a collection within the app
	 * @internal
	 */
	registerCollection(collection: Collection) {
		this.collections[collection.name] = collection;
	}
}

export default App;
