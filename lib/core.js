var path = require("path"); //path.resolve(module.filename, "../../../prometheus-modules");

var ModuleManager = require("./module/module-manager.js");
var ConfigManager = require("./config/config-manager.js");

var base_chips_location = "../../base-chips";

var default_app_location = "../../example-app";

var PrometheusCore = new function(){

	var mode = null;

	var proper_layer_names = {"db" : true , "biz" : true , "web" : true};

	//applies only to distributed mode
	var which_chip_types_to_start_for_layer = {
		db:  ["datastore"],
		biz: ["field_type", "resource_type", "service"],   
		web: ["field_type", "resource_type", "channel"]   
	}

	function layer_name_valid(layer_name){
		return layer_name in proper_layer_names;
	}

	/**
	 * @param  {string} mode       local|distributed
	 * @param  {string} layer_name db|biz|web
	 */
	function decide_chip_types_to_start(mode, layer_name){
		if(mode=="local"){
			return ["field_type", "resource_type", "service", "channel", "datastore"];
		}else if(!layer_name_valid(layer_name)){
			throw new Error("Invalid layer name: " + layer_name);
		}else{
			return which_chip_types_to_start_for_layer[layer_name];

		}
	}

	function getDispatcher(mode, layer_name){
		if(mode=="local"){
			return require("../lib/dispatchers/local/dispatcher-local.js");			
		}else{
			return require("../lib/dispatchers/" + layer_name + "/dispatcher-" + layer_name + ".js");
		}
	}

	/**
	 * [init description]
	 * @param  {string} mode       local|distributed
	 * @param  {string} layer_name db|biz|web
	 */
	this.start = function(mode, layer_name, app_location){
		mode = mode || "local";
		layer_name = layer_name || null;
		app_location = app_location ||  path.resolve(module.filename, default_app_location);
		config_file_path = app_location + "/app.config.json";

		ConfigManager.readFromFile(config_file_path); //if the argument is null then the default configuration file (config.default.json) is used


		//module needed for basic Prometheus operations
		base_module_dir = path.resolve(module.filename, base_chips_location	);
		ModuleManager.add_module(base_module_dir);

		ModuleManager.add_modules(app_location + "/modules");

		var chip_types_to_start = decide_chip_types_to_start(mode, layer_name);

		var dispatcher = getDispatcher(mode, layer_name);
		

		ModuleManager.initialize_all(dispatcher);

		dispatcher.init && dispatcher.init();

		ModuleManager.start(chip_types_to_start);//returns a promise
	};

}

module.exports = PrometheusCore;