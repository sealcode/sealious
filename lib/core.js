global.Sealious = {};

Sealious.Errors = require("./response/error.js"); 
Sealious.ChipManager = require("./chip-types/chip-manager.js");
Sealious.ConfigManager = require("./config/config-manager.js");

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

Sealious.App = require("./app.js");


module.exports = Sealious;