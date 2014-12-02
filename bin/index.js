require("prometheus-exception-handler");
var core = require("prometheus-core");
var LayerManager = require("prometheus-layer-manager");
var db_layer = require("prometheus-database-layer");

/*
if(process.argv.length == 2){
	if(process.argv[1]==__dirname){
		console.log("Web&Biz local mode on");
	}

}else if(process.argv.length > 2){
	for (var i = 2; i < process.argv.length; i++) {
		if(process.argv[i] == "-l"){
			switch(process.argv[i+1]){
				case 'db':
					console.log("DB on");
					break;
				case 'biz':
					require('./biz/biz.js');
					break;
				case 'web':
					require('./web/web.js');
					break;
				default:
					console.log("ERR: Unknown layer name");
					break;
			}
		}
	};
}

*/

core.bootstrap();
LayerManager.init();
