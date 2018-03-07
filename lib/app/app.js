const locreq = require("locreq")(__dirname);
const assert = require("assert");
const path = require("path");
const Promise = require("bluebird");
const PatternEmitter = require("pattern-emitter-promise").EventEmitter;
PatternEmitter.setPromiseLibrary(Promise);

const Sealious = locreq("lib/main.js");

const ConfigManager = locreq("lib/app/config-manager.js");
const ChipManager = locreq("lib/app/chip-manager.js");
const Logger = locreq("lib/app/logger.js");
const RootSubject = locreq("lib/subject/predefined-subjects/root-subject.js");
const Action = locreq("lib/action.js");
const run_action_curry = locreq("lib/app/run-action-curry.js");
const FileManager = locreq("lib/app/file-manager.js");

const WwwServerFactory = locreq("lib/http/http.js");
const DatastoreMongoFactory = locreq("lib/datastore/db.js");

const load_base_chips = locreq("lib/app/load-base-chips");
const default_config = locreq("default_config.json");

const App = function(custom_config) {
	const sealious_dir = path.resolve(module.filename, "../../../");

	const app = this;

	const ee = new PatternEmitter();

	app.on = ee.on.bind(ee);
	app.off = ee.off.bind(ee);
	app.removeAllListeners = ee.removeAllListeners.bind(ee);
	app.emit = ee.emit.bind(ee);

	app.Sealious = Sealious;

	app.ConfigManager = new ConfigManager();

	for (let key in default_config) {
		app.ConfigManager.setDefault(key, default_config[key]);
	}
	app.ConfigManager.setRoot(custom_config);

	app.Logger = new Logger(app);
	app.ChipManager = new ChipManager(app);
	app.WwwServer = new WwwServerFactory(app);

	app.RootSubject = new RootSubject(app);
	app.Action = Action.curry(app.RootSubject);
	app.run_action = run_action_curry(app);

	load_base_chips(app);

	app.Datastore = new DatastoreMongoFactory(app);

	app.FieldType = Sealious.FieldType.bind(Sealious.FieldType, app);
	app.Collection = Sealious.Collection.bind(Sealious.Collection, app);
	app.AccessStrategyType = Sealious.AccessStrategyType.bind(
		Sealious.AccessStrategyType,
		app
	);

	assert(
		app.ConfigManager.get("upload_path"),
		"'upload_path' not set in config"
	);

	app.FileManager = new FileManager(
		app.Datastore,
		app.Logger,
		app.ConfigManager.get("upload_path")
	);

	return app;
};

App.pure = {
	createChip: function(app, constructor, declaration) {
		const chip = new constructor(app, declaration);
		app.ChipManager.add_chip(constructor.type_name, declaration.name, chip);
		return chip;
	},
	start: function(app) {
		return app.Datastore.start()
			.then(() => {
				return app.WwwServer.start();
			})
			.then(() => app.ChipManager.start_chips().then(() => app));
	},
};

App.prototype = {
	createChip(constructor, declaration) {
		return App.pure.createChip(this, constructor, declaration);
	},
	createAccessStrategyType(declaration) {
		return this.createChip(Sealious.AccessStrategyType, declaration);
	},
	createAccessStrategy(declaration) {
		return this.createChip(Sealious.AccessStrategy, declaration);
	},
	createDatastore(declaration) {
		return this.createChip(Sealious.Datastore, declaration);
	},
	createCollection(declaration) {
		return this.createChip(Sealious.Collection, declaration);
	},
	createChannel(declaration) {
		return this.createChip(Sealious.Channel, declaration);
	},
	createCalculatedFieldType(declaration) {
		return this.createChip(Sealious.CalculatedFieldType, declaration);
	},
	start() {
		return App.pure.start(this);
	},
	async stop() {
		await this.WwwServer.stop();
		await this.Datastore.stop();
	},
};

module.exports = App;
