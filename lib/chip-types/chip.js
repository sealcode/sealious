"use strict";
const Promise = require("bluebird");

let ChipManager;

const Chip = function(type, name){

	this.configuration = {};
	Object.defineProperty(this, "default_configuration", {
		set: this.apply_default_settings,
	});

	this.type = type;
	this.name = name;
	this.longid = `${type}.${name}`;

	if (name){
		ChipManager = ChipManager || require("./chip-manager.js");
		ChipManager.add_chip(type, name, this);
	}
};

Chip.prototype.apply_default_settings = function(default_config){
	for (const i in default_config){
		if (!this.configuration[i]){
			this.configuration[i] = default_config[i];
		}
	}
};

Chip.prototype.configure = function(config){
	config = config || {};
	this.configuration = config;
};

Chip.prototype.start = function(){
	// to be overwritten
	return Promise.resolve();
};

// Chip.prototype.test = function(){
// 	if (this.test_compatibility){
// 		console.log("Starting compatibility tests for chip: `" + this.name + "`");
// 		this.test_compatibility().then(function(){
// 			console.log("\t✓ Compatibility test successfull!");
// 		})
// 	}
// }

module.exports = Chip;
