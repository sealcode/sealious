var path = require("path"); //path.resolve(module.filename, "../../../prometheus-modules");

var ModuleManager = require("./module/module-manager.js");
var ConfigManager = require("./config/config-manager.js");

global.Sealious = {};

Sealious.Errors = require("./response/error.js"); 

Sealious.which_chip_types_to_start_for_layer = {
	db:  ["datastore"],
	biz: ["field_type", "resource_type", "service"],   
	web: ["field_type", "resource_type", "channel"]   
}

Sealious.App = require("./app.js");

module.exports = Sealious;