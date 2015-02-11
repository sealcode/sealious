var fs = require("fs");
var path = require("path");

var ConfigManager = new function(){
	var config = {};

	var default_config_path = __dirname + "/config.default.json";

	this.readFromFile = function(filename){
		filename = filename || default_config_path;
		console.log("filename:", filename);
		config = JSON.parse(fs.readFileSync(filename));
	}

	this.getConfiguration = function(){
		return config;
	}
}

module.exports = ConfigManager;