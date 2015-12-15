var path = require("path");

var Sealious = {};
module.exports = Sealious;

var Core = require("./core.js");

Sealious.Errors = require("./response/error.js");
Sealious.Response = require("./response/response.js");
Sealious.SubjectPath = require("./data-structures/subject-path.js");
Sealious.Subject = require("./subject/subject.js");
Sealious.Action = require("./action.js");

Sealious.File = require("./data-structures/file.js");

Sealious.ChipManager = require("./chip-types/chip-manager.js");
Sealious.ConfigManager = require("./config/config-manager.js");
Sealious.PluginManager = require("./plugins/plugin-manager.js");

Sealious.Context = require("./context.js");
Sealious.FieldStructures = require("./chip-types/field-structures.js");
Sealious.RootSubject = require("./subject/predefined-subjects/root-subject.js");

Sealious.ResourceManager = require("./core-services/resource-manager.js");
Sealious.UserManager = require("./core-services/user_manager.js");
Sealious.FileManager = require("./core-services/file-manager.js");

Sealious.ChipTypes = {
	"AccessStrategy": require("./chip-types/access-strategy.js"),
	"Channel": require("./chip-types/channel.js"),
	"Datastore": require("./chip-types/datastore.js"),
	"FieldType": require("./chip-types/field-type.js"),
	"ResourceType": require("./chip-types/resource-type.js"),
}

// prefix Sealious.ChipTypes[chip_type_name] to Sealious[chip_type_name]
for (var chip_type_name in Sealious.ChipTypes) {
	if (chip_type_name === 'Datastore')
		chip_type_name += 'Creator';
	Sealious[chip_type_name] = Sealious.ChipTypes[chip_type_name];
}

Sealious.Datastore = null; //this variable will hold the default datastore.

Sealious.init = function(){
	require("./base-chips/_base-chips.js");
	Sealious.Logger = require("./logger/logger.js");
	Sealious.PluginManager.load_plugins();
	Sealious.Datastore = Sealious.ChipManager.get_datastore_chip();
}

Sealious.start = function(){
	Core.check_version();
	return Sealious.ChipManager.start_chips();
}

Sealious.test = function(){
	var things_to_test = [
		Sealious.ResourceManager,
		Sealious.ChipTypes.FieldType,
		require("./chip-types/resource-type-field"),
	]

	Sealious.init();

	things_to_test.forEach(function(thing){
		thing.test_init && thing.test_init();
	})

	Sealious.start().then(function(){
		things_to_test.forEach(function(thing){
			thing.test_start && thing.test_start();
		})
		//run(); //function created by Mocha. Present only if Mocha is run with --delay option from the command line (as it is when running `npm test`)
	})
}
