var path = require("path");
var Core = require("./core.js");
var core_instance = null;

global.Sealious = {};

Sealious.Errors = require("./response/error.js"); 
Sealious.Response = require("./response/response.js");

Sealious.ChipManager = require("./chip-types/chip-manager.js");
Sealious.ConfigManager = require("./config/config-manager.js");
Sealious.Dispatcher = null;

Sealious.Logger = require("./logger/logger.js");

Sealious.which_chip_types_to_start_for_layer = {
	db:  ["datastore"],
	biz: ["field_type", "resource_type", "service"],   
	web: ["field_type", "resource_type", "channel"]   
}

Sealious.ChipTypes = {
	"Datastore": require("./chip-types/datastore.js"),
	"FieldType": require("./chip-types/field-type.js"),
	"ResourceType": require("./chip-types/resource-type.js"),
	"Service": require("./chip-types/service.js")
}

for(var chip_type_name in Sealious.ChipTypes){
	Sealious.ChipTypes[chip_type_name] = Sealious.ChipTypes[chip_type_name].bind(Sealious.ChipTypes[chip_type_name], null); //null here corresponds to "module_path" of chip's constructor
}

Sealious.init = function(mode, layer_name){
	mode = mode ? mode : "local";
	layer_name = layer_name ? layer_name : null;
	var root_module = module;
	while(root_module.parent){
		root_module = root_module.parent;
	}
	var path_to_package_json = path.resolve(root_module.filename, "../package.json");
	core_instance = new Core(path_to_package_json, mode, layer_name)
}

Sealious.start = function(){
	return core_instance.start();
}

module.exports = Sealious;