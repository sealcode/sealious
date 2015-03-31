var path = require("path");

var ModuleManager = require("./module/module-manager.js");
var ConfigManager = require("./config/config-manager.js");

function SealiousApp(path_to_package_json, mode, layer_name){

	this.mode = mode || "local";
	this.layer_name = layer_name || null;

	//ModuleManager = new ModuleManager();
	//ConfigManager = new ConfigManager();

	if(this.mode=="local"){
		this.dispatcher = require("../lib/dispatchers/local/dispatcher-local.js");			
	}else{
		this.dispatcher = require("../lib/dispatchers/" + layer_name + "/dispatcher-" + layer_name + ".js");
	}

	this.init(require(path_to_package_json));
}

SealiousApp.prototype = new function(){

	this.load_base_modules = function(){
		ModuleManager.add_module(require.resolve("sealious-base-chips"))
	}

	this.config = function(config_object){
		ConfigManager.set_config(config_object);
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
		for(var dependency_name in dependencies){
			try{
				var dependency_path = require.resolve(dependency_name);				
			}catch(e){
				var dependency_path = path.resolve(module.parent.parent.parent.filename, "./node_modules/"+dependency_name);
			}
			var dep_info = path.parse(dependency_path);
			if(dep_info.name=="sealious-module" && dep_info.ext==".json"){
				console.log("~~~~~~ADDING SEALIOUS MODULE")
				ModuleManager.add_module(dependency_path);				
			}
		}
		ModuleManager.initialize_all(this.dispatcher);		
	}

	var which_chip_types_to_start_for_layer = {
		db: ["datastore"],
		biz: ["field_type", "resource_type", "service"],
		web: ["field_type", "resource_type", "channel"]
	}

	function decide_chip_types_to_start(mode, layer_name){
		if(mode=="local"){
			return ["field_type", "resource_type", "service", "channel", "datastore"];
		//}else if(!(layer_name)){
		//	throw new SealiousErrors.ValidationError("Invalid layer name: " + layer_name); //~
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
		var dispatcher = getDispatcher(this.mode, this.layer_name);

		var chip_types_to_start = decide_chip_types_to_start(this.mode, this.layer_name);

		this.dispatcher.init();
		this.dispatcher.start();

		console.log(chip_types_to_start);

		return ModuleManager.start(chip_types_to_start);
	}

}

module.exports = SealiousApp;