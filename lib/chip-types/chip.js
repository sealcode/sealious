var Promise = require("bluebird");

var ChipManager = null;

var chip = function(parent_module_path, add_to_chip_manager, type, name){

	this.configuration = {};
	Object.defineProperty(this, "default_configuration", {
		set: this.apply_default_settings
	})	

	this.type = type;
	this.name = name;
	this.longid = type + "." + name;

	if(add_to_chip_manager){
		var ChipManager = ChipManager || require("./chip-manager.js");
		ChipManager.add_chip(type, name, this, parent_module_path);		
	}
}

chip.prototype = new function(){

	this.apply_default_settings = function(default_config){
		for(var i in default_config){
			if(!this.configuration[i]){
				this.configuration[i]=default_config[i];
			}
		}
	}

	this.configure = function(config){
		config = config || {};
		this.configuration = config;
	}	

	this.start = function(){
		//to be overwritten
		return new Promise(function(resolve, reject){
			resolve();
		})	
	}
}


module.exports = chip;