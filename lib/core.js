var path = require("path");
var http = require("http");

var ModuleManager = require("./module/module-manager.js");
var ConfigManager = require("./config/config-manager.js");

function SealiousCore(path_to_package_json, mode, layer_name){

	this.mode = mode || "local";
	this.layer_name = layer_name || null;

	
	if(this.mode=="local"){
		this.dispatcher = require("../lib/dispatchers/local/dispatcher-local.js");			
	}else{
		this.dispatcher = require("../lib/dispatchers/" + this.layer_name + "/dispatcher-" + this.layer_name + ".js");
	}

	this.init(require(path_to_package_json));
}

SealiousCore.prototype = new function(){

	var check_version = function(package_info){
		var pkg = require("../package.json")
		var arraySplit = pkg.version.split(".");
		var version = arraySplit[0]+"."+arraySplit[1];
		var url = "http://registry.npmjs.org/sealious/"+version;

		http.get(url, function(res) {
			res.setEncoding('utf8');		
			var body = "";
			res.on('data', function (chunk) {
				body += chunk.toString();
			});
			res.on('end', function(){
				var sealious_npm = JSON.parse(body);
				Sealious.Logger.info("Latest Sealious version: ", sealious_npm.version);
				if (sealious_npm.version !== pkg.version) {
					Sealious.Logger.warning("Your Sealious version: ", pkg.version);
					Sealious.Logger.warning("Type in `npm install sealious@"+sealious_npm.version+"` to update.");
				}
				else {
					Sealious.Logger.info("Your Sealious version: ", pkg.version);
				}
			});
		});
	}


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
		check_version(package_info);
		this.load_base_modules();
		this.load_all_modules(package_info);
	}

	this.load_all_modules = function(package_info){
		var dependencies = package_info.dependencies;
		for(var dependency_name in dependencies){
			try{
				var dependency_path = require.resolve(dependency_name);				
			}catch(e){
				//in case the module is npm link-ed
				var dependency_path = require.resolve(path.resolve(module.parent.parent.filename, "../node_modules/"+dependency_name));
			}
			var dep_info = path.parse(dependency_path);
			if(dep_info.name=="sealious-module" && dep_info.ext==".json"){
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
		//	throw new Sealious.Errors.ValidationError("Invalid layer name: " + layer_name); //~
	}else{
		return which_chip_types_to_start_for_layer[layer_name];
	}
}

function getDispatcher(mode, layer_name){
	if(mode=="local"){
		var dispatcher_path = "./dispatchers/local/dispatcher-local.js";			
	}else{
		var dispatcher_path = "./dispatchers/" + layer_name + "/dispatcher-" + layer_name + ".js";
	}
	return require(dispatcher_path);
}

this.start = function(){
	Sealious.Dispatcher = this.dispatcher;
	this.dispatcher.init();
	this.dispatcher.start();

	var chip_types_to_start = decide_chip_types_to_start(this.mode, this.layer_name);

	return ModuleManager.start(chip_types_to_start);
}

}

module.exports = SealiousCore;