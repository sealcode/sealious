var Sealious = require("../main.js");
var fs = require("fs");
var path = require("path");

var merge = require("merge");

var ConfigManager = new function(){
	default_config = {};
	config = {};

	function modify_config(is_default_config, key, value){
		var key_elements = key.split('.');
		var new_values = {};
		var current_position = new_values;
		for(var i=0; i<key_elements.length-1; i++){
			var current_key = key_elements[i];
			current_position[current_key] = {};
			current_position = current_position[current_key];
		}
		current_position[key_elements[key_elements.length-1]]=value;
		if(is_default_config){
			default_config = merge.recursive(true, default_config, new_values);
		}else{
			config = merge.recursive(true, config, new_values);
		}
	}

	this.set_config = function(key, new_config){
		if(arguments.length==1){
			config = config;
		}else{
			modify_config(false, key, new_config);
		}
	}

	this.set_default_config = function(key, value){
		if(arguments.length==1){
			default_config = default_config;
		}else{
			modify_config(true, key, value);
		}
	}

	this.get_configuration = function(key){
		var to_merge_left = default_config;
		var to_merge_right = config;
		var key_elements = key==undefined? [] : key.split(".");
		while(key_elements.length){
			var current_key = key_elements.splice(0, 1);
			to_merge_left = to_merge_left[current_key]==undefined? {} : to_merge_left[current_key];
			to_merge_right = to_merge_right[current_key]==undefined? {} : to_merge_right[current_key];
		}
		return merge.recursive(true, to_merge_left, to_merge_right);
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