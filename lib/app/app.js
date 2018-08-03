const locreq = require("locreq")(__dirname);
const assert = require("assert");
const path = require("path");

const Sealious = locreq("lib/main.js");

const ConfigManager = locreq("lib/app/config-manager.js");
const ChipManager = locreq("lib/app/chip-manager.js");
const { Hookable } = locreq("lib/app/hookable.js");
const Logger = locreq("lib/app/logger.js");
const RootSubject = locreq("lib/subject/predefined-subjects/root-subject.js");
const Action = locreq("lib/action.js");
const run_action_curry = locreq("lib/app/run-action-curry.js");
const FileManager = locreq("lib/app/file-manager.js");

const WwwServerFactory = locreq("lib/http/http.js");
const DatastoreMongoFactory = locreq("lib/datastore/db.js");
const MetadataFactory = locreq("lib/app/metadata.js");

const load_base_chips = locreq("lib/app/load-base-chips");
const default_config = locreq("default_config.json");
const EmailFactory = locreq("lib/email/email.js");
const EmailTemplates = locreq("lib/email/templates/templates");
const i18nFactory = locreq("lib/i18n/i18n");
const Query = locreq("lib/datastore/query");
const SpecialFilterFactory = locreq("lib/chip-types/special-filter.js");
const load_special_filters = locreq(
	"lib/app/base-chips/special_filters/load-special-filters.js"
);

class App extends Hookable {
	constructor(custom_config, manifest) {
		super();

		this.launch_time = Date.now();

		this.status = "stopped";
		this.Sealious = Sealious;
		this.Query = Query;

		this.manifest = manifest;
		this.checkManifest(manifest);

		this.i18n = i18nFactory(manifest.default_language);

		this.ConfigManager = new ConfigManager();

		for (let key in default_config) {
			this.ConfigManager.setDefault(key, default_config[key]);
		}
		this.ConfigManager.setRoot(custom_config);

		this.Logger = new Logger(this);
		this.ChipManager = new ChipManager(this);

		this.Mail = this.Email = EmailFactory(this);
		this.EmailTemplates = this.MailTemplates = EmailTemplates;
		this.WwwServer = new WwwServerFactory(this);

		this.RootSubject = new RootSubject(this);
		this.Action = Action.curry(this.RootSubject);
		this.run_action = run_action_curry(this);

		load_base_chips(this);

		this.Datastore = new DatastoreMongoFactory(this);
		this.Metadata = MetadataFactory(this);

		this.FieldType = Sealious.FieldType.bind(Sealious.FieldType, this);
		this.Collection = Sealious.Collection.bind(Sealious.Collection, this);
		this.AccessStrategyType = Sealious.AccessStrategyType.bind(
			Sealious.AccessStrategyType,
			this
		);

		this.SpecialFilter = SpecialFilterFactory(this);
		load_special_filters(this);

		assert(
			this.ConfigManager.get("upload_path"),
			"'upload_path' not set in config"
		);

		this.FileManager = new FileManager(
			this.Datastore,
			this.Logger,
			this.ConfigManager.get("upload_path")
		);
	}

	checkManifest(manifest) {
		assert(manifest, "Please provide the app manifest");
		[
			"name",
			"logo",
			"version",
			"default_language",
			"base_url",
			"admin_email",
		].forEach(key => {
			assert(
				manifest[key],
				`Please specify '${key}' field in the app manifest`
			);
		});
	}

	createChip(constructor, declaration) {
		const chip = new constructor(
			this,
			declaration
		);
		this.ChipManager.add_chip(
			constructor.type_name,
			declaration.name,
			chip
		);
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

		await this.emit({ when: "before", action: "start" });
		await this.Datastore.start();
		await this.Mail.init();
		await this.ChipManager.start_chips();
		await this.emit({ when: "after", action: "start" });
		this.status = "running";
		return this;
	}

	async stop() {
		this.status = "stopping";
		await this.emit({ when: "before", action: "stop" });
		await this.WwwServer.stop();
		await this.Datastore.stop();
		this.status = "stopped";
		await this.emit({ when: "after", action: "stop" });
	}
}

module.exports = App;
