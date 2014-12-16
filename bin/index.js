require("prometheus-exception-handler");
var ModuleManager = require("prometheus-module-manager").ModuleManager;
var LayerManager = require("prometheus-layer-manager");


if(LayerManager.isValid()){
	ModuleManager.bootstrap();
	LayerManager.init();
} else {
	console.log("ERR: Unknown command or layer name.")
}
