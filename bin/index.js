require("prometheus-exception-handler");
var core = require("prometheus-core");
var LayerManager = require("prometheus-layer-manager");
var db_layer = require("prometheus-database-layer");

if(LayerManager.validate()){
	core.bootstrap();
	LayerManager.init();
} else {
	console.log("ERR: Unknown command or layer name.")
}
