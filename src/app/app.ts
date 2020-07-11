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
import { Collection, Hookable, SuperContext, Context } from "../main";
import { ManifestData } from "./manifest";

import Collections from "./collections/collections";
import Logger from "./logger";

const default_config = locreq("default_config.json");

export type AppEvents = "starting" | "started" | "stopping" | "stopped";

class App extends Hookable {
	launch_time: number;
	status: "stopped" | "running" | "starting" | "stopping";
	Sealious: typeof Sealious;
	manifest: Sealious.Manifest;
	i18n: any;
	ConfigManager: Sealious.ConfigManager;
	Logger: Logger;
	Email: Mailer;
	HTTPServer: Sealious.HttpServer;
	RootSubject: Sealious.Subject;
	Action: (
		subject_path: Sealious.SubjectPath,
		action_name: ActionName
	) => Sealious.Action;
	runAction: (
		context: Sealious.Context,
		path: SubjectPathEquiv,
		action: ActionName,
		params?: any
	) => Promise<any>;
	Datastore: Datastore;
	Metadata: Metadata;
	private e: Emittery;
	collections: { [name: string]: Collection } = {};
	public SuperContext: new () => SuperContext;
	public Context: new () => Context;
	constructor(custom_config: PartialConfig, manifest: ManifestData) {
		super();
		this.e = new Emittery();

		this.launch_time = Date.now();

		this.status = "stopped";
		this.Sealious = Sealious;
		this.manifest = new Sealious.Manifest(manifest);
		this.manifest.validate();

		this.i18n = Sealious.i18nFactory(this.manifest.default_language);

		this.ConfigManager = new Sealious.ConfigManager();

		for (let key in default_config) {
			this.ConfigManager.setDefault(key, default_config[key]);
		}
		this.ConfigManager.setRoot(custom_config);

		this.Logger = new Logger();

		this.Email = Sealious.EmailFactory(this);
		this.HTTPServer = new Sealious.HttpServer(this);

		this.RootSubject = new Sealious.RootSubject(this);
		this.Action = Sealious.Action.curry(this.RootSubject);
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
		this.SuperContext = class extends SuperContext {
			constructor() {
				super(app);
			}
		};
		this.Context = class extends Context {
			constructor() {
				super(app);
			}
		};
	}

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

	async stop() {
		this.status = "stopping";
		await this.e.emit("stopping");
		await this.HTTPServer.stop();
		this.Datastore.stop();
		this.status = "stopped";
		await this.e.emit("stopped");
	}

	async removeAllData() {
		Object.keys(this.collections).map((collection_name) =>
			this.Datastore.remove(collection_name, {}, "just_one" && false)
		);
	}

	async on(event_name: AppEvents, callback: () => void) {
		this.e.on(event_name, callback);
	}

	registerCollection(collection: Collection) {
		this.collections[collection.name] = collection;
	}
}

export default App;
