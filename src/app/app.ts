// @ts-ignore
const locreq = require("locreq")(__dirname);
import { EventEmitter } from "events";
import assert from "assert";
import winston from "winston";
import { ActionName } from "../action";
import Mailer from "../email/mailer";
import * as Sealious from "../main";
import load_base_chips from "./load-base-chips";

import run_action_curry from "./run-action-curry.js";
import Datastore from "../datastore/datastore";
import Metadata from "./metadata";
import load_special_filters from "./base-chips/special_filters/load-special-filters.js";
import Field from "../chip-types/field";
import { SubjectPathEquiv } from "../data-structures/subject-path";
import { PartialConfig } from "./config";

const default_config = locreq("default_config.json");

type AppEvents = "starting" | "started" | "stopping" | "stopped";

class App extends Sealious.Hookable {
	launch_time: number;
	status: "stopped" | "running" | "starting" | "stopping";
	Sealious: typeof Sealious;
	manifest: Sealious.Manifest;
	i18n: any;
	ConfigManager: Sealious.ConfigManager;
	Logger: winston.Logger;
	ChipManager: Sealious.ChipManager;
	Email: Mailer;
	HTTPServer: Sealious.HttpServer;
	RootSubject: Sealious.Subject;
	Action: (
		subject_path: Sealious.SubjectPath,
		action_name: ActionName
	) => Sealious.Action;
	run_action: (
		context: Sealious.Context,
		path: SubjectPathEquiv,
		action: ActionName,
		params?: any
	) => Promise<any>;
	Datastore: Datastore;
	Metadata: Metadata;
	FileManager: Sealious.FileManager;
	private e: EventEmitter;
	constructor(custom_config: PartialConfig, manifest: Sealious.Manifest) {
		super();
		this.e = new EventEmitter();

		this.launch_time = Date.now();

		this.status = "stopped";
		this.Sealious = Sealious;
		this.manifest = manifest;
		this.checkManifest(manifest);

		this.i18n = Sealious.i18nFactory(manifest.default_language);

		this.ConfigManager = new Sealious.ConfigManager();

		for (let key in default_config) {
			this.ConfigManager.setDefault(key, default_config[key]);
		}
		this.ConfigManager.setRoot(custom_config);

		this.Logger = Sealious.Logger(this);
		this.ChipManager = new Sealious.ChipManager(this);

		this.Email = Sealious.EmailFactory(this);
		this.HTTPServer = new Sealious.HttpServer(this);

		this.RootSubject = new Sealious.RootSubject(this);
		this.Action = Sealious.Action.curry(this.RootSubject);
		this.run_action = run_action_curry(this);

		load_base_chips(this);

		this.Datastore = Sealious.DatastoreMongoFactory();
		this.Metadata = new Sealious.MetadataFactory(this);

		load_special_filters(this);

		assert(
			this.ConfigManager.get("upload_path"),
			"'upload_path' not set in config"
		);

		this.FileManager = new Sealious.FileManager(
			this.Datastore,
			this.Logger,
			this.ConfigManager.get("upload_path")
		);
	}

	checkManifest(manifest: Sealious.Manifest) {
		assert(manifest, "Please provide the app manifest");
		[
			"name",
			"logo",
			"version",
			"default_language",
			"base_url",
			"admin_email",
		].forEach((key: keyof Sealious.Manifest) => {
			assert(
				manifest[key],
				`Please specify '${key}' field in the app manifest`
			);
		});
	}

	createChip(
		constructor:
			| typeof Sealious.AccessStrategy
			| typeof Field
			| typeof Sealious.Collection,
		declaration: any
	) {
		const chip = constructor.fromDefinition(this, declaration);
		this.ChipManager.addChip(chip.type_name, declaration.name, chip);
		return chip;
	}

	async start() {
		this.status = "starting";
		assert(
			["dev", "production"].includes(
				this.ConfigManager.get("core.environment")
			),
			`"core.environment" config should be either "dev" or "production"`
		);

		this.e.emit("starting");
		await this.Datastore.start(this);
		await this.Email.init();
		await this.ChipManager.startChips();
		this.e.emit("started");
		this.status = "running";
		return this;
	}

	async stop() {
		this.status = "stopping";
		this.e.emit("stopping");
		await this.HTTPServer.stop();
		this.Datastore.stop();
		this.status = "stopped";
		this.e.emit("stopped");
	}

	async removeAllData() {
		this.ChipManager.getAllCollections().map((collection_name) =>
			this.Datastore.remove(collection_name, {}, "just_one" && false)
		);
	}

	async on(event_name: string, callback: () => void) {
		this.e.on(event_name, callback);
	}
}

export default App;
