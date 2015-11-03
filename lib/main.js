var path = require("path");

var Sealious = {};
module.exports = Sealious;

var core_instance = null;

var Core = require("./core.js");

Sealious.Errors = require("./response/error.js");
Sealious.Response = require("./response/response.js");

Sealious.File = require("./data-structures/file.js");

Sealious.ChipManager = require("./chip-types/chip-manager.js");
Sealious.ConfigManager = require("./config/config-manager.js");
Sealious.PluginManager = require("./plugins/plugin-manager.js");
Sealious.Dispatcher = null;
Sealious.Context = require("./context.js");
Sealious.SubjectPath = require("./data-structures/subject-path.js");

Sealious.ResourceManager = require("./core-services/resource-manager.js");


Sealious.ChipTypes = {
	"AccessStrategy": require("./chip-types/access-strategy.js"),
	"Channel": require("./chip-types/channel.js"),
	"Datastore": require("./chip-types/datastore.js"),
	"FieldType": require("./chip-types/field-type.js"),
	"ResourceType": require("./chip-types/resource-type.js"),
}

for (var chip_type_name in Sealious.ChipTypes) {
	//Sealious.ChipTypes[chip_type_name] = Sealious.ChipTypes[chip_type_name].bind(Sealious.ChipTypes[chip_type_name], null); //null here corresponds to "module_path" of chip's constructor
}

Sealious.init = function(mode, layer_name){
	Sealious.Logger = require("./logger/logger.js");
	require("./base-chips/_base-chips.js");
	Sealious.PluginManager.load_plugins();
	this.mode = mode ? mode : "local";
	this.layer_name = layer_name ? layer_name : null;
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

module.exports = Sealious;