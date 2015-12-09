var path = require("path");

var Sealious = {};
module.exports = Sealious;

var Core = require("./core.js");

Sealious.Errors = require("./response/error.js");
Sealious.Response = require("./response/response.js");

Sealious.File = require("./data-structures/file.js");

Sealious.ChipManager = require("./chip-types/chip-manager.js");
Sealious.ConfigManager = require("./config/config-manager.js");
Sealious.PluginManager = require("./plugins/plugin-manager.js");
Sealious.Dispatcher = null;
Sealious.Context = require("./context.js");

Sealious.ResourceManager = require("./core-services/resource-manager.js");

Sealious.ChipTypes = {
	"AccessStrategy": require("./chip-types/access-strategy.js"),
	"Channel": require("./chip-types/channel.js"),
	"Datastore": require("./chip-types/datastore.js"),
	"FieldType": require("./chip-types/field-type.js"),
	"ResourceType": require("./chip-types/resource-type.js"),
}

// prefix Sealious.ChipTypes[chip_type_name] to Sealious[chip_type_name]
for (var chip_type_name in Sealious.ChipTypes) {
	Sealious[chip_type_name] = Sealious.ChipTypes[chip_type_name];
}

Sealious.init = function(){
	Sealious.Logger = require("./logger/logger.js");
	require("./base-chips/_base-chips.js");
	Sealious.PluginManager.load_plugins();
}

Sealious.start = function(){
	Core.check_version();
	var dispatcher = require("./dispatchers/dispatcher.js");
	dispatcher.init();
	Sealious.Dispatcher = dispatcher;
	return Sealious.ChipManager.start_chips();
}

module.exports = Sealious;