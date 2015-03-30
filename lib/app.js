var ModuleManager = require("./module/module-manager.js");
var ConfigManager = require("./config/config-manager.js");

function SealiousApp(path_to_package_json, mode, layer_name){

	mode = mode || "local";
	layer_name = layer_name || null;

	this.module_manager = new ModuleManager();
	this.config_manager = new ConfigManager();

	if(mode=="local"){
		this.dispatcher = require("../lib/dispatchers/local/dispatcher-local.js");			
	}else{
		this.dispatcher = require("../lib/dispatchers/" + layer_name + "/dispatcher-" + layer_name + ".js");
	}

	this.init(require(path_to_package_json));
}

SealiousApp.prototype = new function(){

	this.load_base_modules = function(){
		this.module_manager.add_module(require.resolve("sealious-base-chips"))
	}

	this.config = function(config_object){
		this.config_manager.set_config(config_object);
	}

	this.config_from_file = function(path_to_file){
		this.config(require(path_to_file));
	}

	this.init = function(package_info){
		this.load_base_modules();
		this.load_all_modules(package_info);
	}

	this.load_all_modules = function(package_info){
		var dependencies = package_info.dependencies;
		console.log("@@@@@@@", require.resolve("Set"));
		console.log("@@@@@@@2", require.resolve("random"));
		for(var dependency_name in dependencies){
			var dependency_path = require.resolve(dependency_name); //should be a path to `sealious-module.json file
			var is_sealious_module = true;
			try{
				require(dependency_path);
			}catch(e){
				is_sealious_module = false;
			}
			if(is_selious_module){
				this.module_manager.add_module(dependency_path);
			}
		}
		this.module_manager.initialize_all(this.dispatcher);		
	}

	function decide_chip_types_to_start(mode, layer_name){
		if(mode=="local"){
			return ["field_type", "resource_type", "service", "channel", "datastore"];
		}else if(!layer_name_valid(layer_name)){
			throw new SealiousErrors.ValidationError("Invalid layer name: " + layer_name); //~
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

	this.start = function(){
		var dispatcher = getDispatcher(mode, layer_name);

		var chip_types_to_start = decide_chip_types_to_start(mode, layer_name);

		this.dispatcher.init();
		this.dispatcher.start();

		return this.module_manager.start(chip_types_to_start);
	}

}

module.exports = SealiousApp;