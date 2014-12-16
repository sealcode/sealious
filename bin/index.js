require("prometheus-exception-handler");
var LayerManager = require("prometheus-layer-manager");
var ModuleManager = require("prometheus-module-manager").ModuleManager;


if(LayerManager.isValid()){
	ModuleManager.bootstrap();
	LayerManager.init();
} else {
	console.log("ERR: Unknown command or layer name.")
}
