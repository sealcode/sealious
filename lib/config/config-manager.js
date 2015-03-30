var fs = require("fs");
var path = require("path");

var ConfigManager = function(){
	this.config = {};
}

ConfigManager.prototype = new function(){

	this.set_config = function(config){
		this.config = config;
	}

	this.getConfiguration = function(){
		return this.config;
	}

	this.get_chip_config = function(longid){
		return this.config.chip_config && this.config.chip_config[longid];
	}

	this.get_dispatcher_config = function(){
		return this.config.dispatcher_config || {};
	}
}

module.exports = ConfigManager;