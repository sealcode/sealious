"use strict";
const locreq = require("locreq")(__dirname);
const merge = require("merge");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const get_main_app_dir = locreq("lib/utils/get-main-app-dir.js");

let default_config = {};
let config = {};

function modify_config (is_default_config, key, value){
	const key_elements = key.split(".");
	const new_values = {};
	let current_position = new_values;
	for (let i = 0; i < key_elements.length - 1; i++){
		const current_key = key_elements[i];
		current_position[current_key] = {};
		current_position = current_position[current_key];
	}
	current_position[key_elements[key_elements.length - 1]] = value;
	if (is_default_config){
		default_config = merge.recursive(true, default_config, new_values);
	} else {
		config = merge.recursive(true, config, new_values);
	}
}

const ConfigManager = {
	load_default_config_for_dir: function(dir){
		const default_config_file = path.join(dir, "default_config.yml");
		try {
			const default_config = yaml.safeLoad(fs.readFileSync(default_config_file, "utf8"));
			for (const i in default_config){
				ConfigManager.set_default_config(i, default_config[i]);
			}
		} catch(e){
			// error
		}
	},
	load_custom_config: function(){
		// we're using console.log here because Logger will not be loaded by now, as it needs config to work.
		const log = global.console.log.bind(console);
		const log_error = global.console.error.bind(console);
		const default_file_path = path.resolve(get_main_app_dir(), "./sealious.yml");
		log("Looking for custom config from file in:", default_file_path);
		const custom_config_file = path.resolve(default_file_path);
		try {
			const custom_config = yaml.safeLoad(fs.readFileSync(custom_config_file, "utf8"));
			log("-----");
			log("config:", "\n",  yaml.safeDump(custom_config));
			log("-----");
			for (const i in custom_config){
				ConfigManager.set_config(i, custom_config[i]);
			}
		} catch(e){
			if(e.name === "YAMLException"){
				log_error(`Syntax error in sealious.yml:\n#{e.message}`);
				process.exit(1);
			} else if (e.code === "ENOENT"){
				log("\n\n\tNo 'sealious.yml' file detected.\n\tConsider creating it alongside your app's package.json file if you want to configure the app's chips.\n\n");
			} else {
				log_error(e);
				process.exit(1);
			}
		}
	},
	set_config: function(key, new_config){
		if (arguments.length === 1){
			// config = config;
		} else {
			modify_config(false, key, new_config);
		}
	},
	set_default_config: function(key, value){
		if (arguments.length === 1){
			// default_config = default_config;
		} else {
			modify_config(true, key, value);
		}
	},
	get_configuration: function(key){
		let to_merge_left = default_config;
		let to_merge_right = config;
		const key_elements = key === undefined ? [] : key.split(".");
		while (key_elements.length){
			const current_key = key_elements.splice(0, 1);
			to_merge_left = to_merge_left[current_key] === undefined ? {} : to_merge_left[current_key];
			to_merge_right = to_merge_right[current_key] === undefined ? {} : to_merge_right[current_key];
		}
		return merge.recursive(true, to_merge_left, to_merge_right);
	},
	get_chip_config: function(longid){
		return config.chip_config && config.chip_config[longid];
	},
	get_dispatcher_config: function(){
		return config.dispatcher_config || {};
	}
};

ConfigManager.get_config = ConfigManager.get_configuration;

module.exports = ConfigManager;
