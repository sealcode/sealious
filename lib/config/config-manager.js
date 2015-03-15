var fs = require("fs");
var path = require("path");

var ConfigManager = new function(){
	var config = {};

	var default_config_path = __dirname + "/config.default.json";

	this.readFromFile = function(filename){
		filename = filename || default_config_path;
		config = JSON.parse(fs.readFileSync(filename));
	}

	this.getConfiguration = function(){
		return config;
	}

	this.get_chip_config = function(longid){
		return config.chip_config && config.chip_config[longid];
	}

	this.get_dispatcher_config = function(){
		return config.dispatcher_config || {};
	}
}

module.exports = ConfigManager;