"use strict";
const path = require("path");
const Sealious = {};

module.exports = Sealious;

const Core = require("./core.js");

Sealious.ConfigManager = require("./config/config-manager.js");


Sealious.Errors = require("./response/error.js");
Sealious.Error = Sealious.Errors.Error;
Sealious.Responses = require("./response/responses.js");
Sealious.Response = require("./response/response.js");
Sealious.SubjectPath = require("./data-structures/subject-path.js");
Sealious.Subject = require("./subject/subject.js");

Sealious.VirtualFile = require("./data-structures/virtual-file.js");

Sealious.Context = require("./context.js");
Sealious.SuperContext = require("./super-context.js");
Sealious.FieldStructures = require("./chip-types/field-structures.js");


Sealious.Datastore = null; // this variable will hold the default datastore.

Sealious.init = function(){
	const sealious_dir = path.resolve(module.filename, "../../");
	Sealious.ConfigManager.load_default_config_for_dir(sealious_dir);
	Sealious.ConfigManager.load_custom_config();

	Sealious.Logger = require("./logger/logger.js");

	Sealious.ChipManager = require("./chip-types/chip-manager.js");
	Sealious.Action = require("./action.js");
	Sealious.run_action = require("./utils/run-action.js");
	Sealious.RootSubject = require("./subject/predefined-subjects/root-subject.js");
	Sealious.File = require("./data-structures/file.js");
	Sealious.FileManager = require("./core-services/file-manager.js");

	Sealious.ChipTypes = {
		"AccessStrategyType": require("./chip-types/access-strategy-type.js"),
		"AccessStrategy": require("./chip-types/access-strategy.js"),
		"Channel": require("./chip-types/channel.js"),
		"Datastore": require("./chip-types/datastore.js"),
		"FieldType": require("./chip-types/field-type.js"),
		"Collection": require("./chip-types/collection.js")
	};
	// prefix Sealious.ChipTypes[chip_type_name] to Sealious[chip_type_name]
	for (let chip_type_name in Sealious.ChipTypes){
		if (chip_type_name === "Datastore"){
			chip_type_name += "Creator";
		}
		Sealious[chip_type_name] = Sealious.ChipTypes[chip_type_name];
	}

	Sealious.PluginManager = require("./plugins/plugin-manager.js");
	Sealious.PluginManager.load_plugins();


	require("./base-chips/_base-chips.js");
	Sealious.Datastore = Sealious.ChipManager.get_datastore_chip();
};

Sealious.start = function(){
	Core.check_version();
	return Sealious.ChipManager.start_chips()
	.then(() => Sealious);
};

module.exports = Sealious;
