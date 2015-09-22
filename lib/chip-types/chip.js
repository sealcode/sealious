var Promise = require("bluebird");

var ChipManager = null;

var chip = function(add_to_chip_manager, type, name){

	this.configuration = {};
	Object.defineProperty(this, "default_configuration", {
		set: this.apply_default_settings
	})

	this.type = type;
	this.name = name;
	this.longid = type + "." + name;

	if (add_to_chip_manager) {
		var ChipManager = ChipManager || require("./chip-manager.js");
		ChipManager.add_chip(type, name, this);
	}
}

chip.prototype = new function(){

	this.apply_default_settings = function(default_config){
		for (var i in default_config) {
			if (!this.configuration[i]) {
				this.configuration[i] = default_config[i];
			}
		}
	}

	this.configure = function(config){
		config = config || {};
		this.configuration = config;
	}

	this.start = function(){
		//to be overwritten
		return Promise.resolve();
	}

	this.test = function(){
		if (this.test_compatibility) {
			console.log("Starting compatibility tests for chip: `" + this.name + "`");
			this.test_compatibility().then(function(){
				console.log("\t✓ Compatibility test successfull!");
			})
		}
	}
}



module.exports = chip;