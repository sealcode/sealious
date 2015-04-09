var fs = require("fs");
var path = require("path");

var merge = require("merge");

var ConfigManager = new function(){
	default_config = {};
	config = {};

	function modify_config(config_object, key, value){
		var key_elements = key.split('.');
		var new_values = {};
		var current_position = new_values;
		for(var i=0; i<key_elements.length-1; i++){
			current_position[key] = {};
			current_position = current_position[key];
		}
		current_position[key_elements[key_elements.length-1]]=value;
		default_config = merge.recursive(default_config, new_values);		
	}

	this.set_config = function(key, new_config){
		if(arguments.length==1){
			config = config;
		}else{
			modify_config(config, key, new_config);
		}
	}

	this.set_default_config = function(key, value){
		if(arguments.length==1){
			default_config = default_config;
		}else{
			modify_config(default_config, key, value);
		}
	}

	this.get_configuration = function(){
		return merge(default_config, config);
	}

	this.get_config = this.get_configuration;

	this.get_chip_config = function(longid){
		return config.chip_config && config.chip_config[longid];
	}

	this.get_dispatcher_config = function(){
		return config.dispatcher_config || {};
	}

}

module.exports = ConfigManager;