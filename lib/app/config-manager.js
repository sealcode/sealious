"use strict";
const locreq_curry = require("locreq");
const locreq = locreq_curry(__dirname);
const merge = require("merge");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const get_main_app_dir = locreq("lib/utils/get-main-app-dir.js");

const ConfigManager = function(){
	this.default_config = {};
	this.config = {};
};

ConfigManager.pure = {
	load_default_config_for_dir: function(default_config_arg, config_arg, dir){
		const default_config_file = path.join(dir, "default_config.yml");
		try{
			const default_config = yaml.safeLoad(fs.readFileSync(default_config_file, "utf8"));
			return ConfigManager.pure.set_default_config(
				default_config_arg,
				config_arg,
				merge.recursive(default_config_arg, default_config)
			);
		}catch(e){
			if(e.code === "ENOENT"){
				return null;
			}else{
				throw e;
			}
		}
	},
	load_custom_config: function(default_config, config, app_dir){
		// we're using console.log here because Logger will not be loaded by now, as it needs config to work.
		const log = global.console.log.bind(console);
		const log_error = global.console.error.bind(console);
		const default_file_path = locreq_curry(app_dir).resolve("sealious.yml");
		log("Looking for custom config from file in:", default_file_path);
		const custom_config_file = path.resolve(default_file_path);
		try {
			const custom_config = yaml.safeLoad(fs.readFileSync(custom_config_file, "utf8"));
			log("-----");
			log("custom config:", "\n",  yaml.safeDump(custom_config));
			log("-----");
			return ConfigManager.pure.set_config(default_config, config, custom_config);
		} catch(e){
			if(e.name === "YAMLException"){
				log_error("Syntax error in sealious.yml:\n#{e.message}");
				process.exit(1);
			} else if (e.code === "ENOENT"){
				log("\n\n\tNo 'sealious.yml' file detected.\n\tConsider creating it alongside your app's package.json file if you want to configure the app's chips.\n\n");
			} else {
				log_error(e);
				process.exit(1);
			}
			return null;
		}
	},
	set_config: function(default_config, config, key, new_config){
		if (arguments.length === 3){
			return [default_config, arguments[2]];
		} else {
			return ConfigManager.pure.modify_config(default_config, config, false, key, new_config);
		}
	},
	set_default_config: function(default_config, config, key, value){
		if (arguments.length === 3){
			return [arguments[2], config];
		} else {
			return ConfigManager.pure.modify_config(default_config, config, true, key, value);
		}
	},
	get_configuration: function(default_config, config, key){
		let to_merge_left = default_config;
		let to_merge_right = config;
		const key_elements = key === undefined ? [] : key.split(".");
		while (key_elements.length){
			const current_key = key_elements.splice(0, 1);
			to_merge_left = to_merge_left[current_key] === undefined ? {} : to_merge_left[current_key];
			to_merge_right = to_merge_right[current_key] === undefined ? {} : to_merge_right[current_key];
		}
		const merged = merge.recursive(true, to_merge_left, to_merge_right);
		return merged;
	},
	modify_config: function(default_config, config, is_default_config, key, value){
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
		return [default_config, config];
	},
};

ConfigManager.prototype = {
	apply_changes: function(config_array){
		// config_array is [default_config, config] or null;
		if(config_array === null) return;
		if(config_array instanceof Array){
			this.default_config = config_array[0];
			this.config = config_array[1];
		}else{
			throw new Error(`Bad configuration array:${  config_array.toString()}`);
		}
	},
	load_default_config_for_dir: function(dir){
		return this.apply_changes(
			ConfigManager.pure.load_default_config_for_dir(this.default_config, this.config, dir)
		);
	},
	load_custom_config: function(app_dir){
		return this.apply_changes(
			ConfigManager.pure.load_custom_config(this.default_config, this.config, app_dir)
		);
	},
	set_config: function(key, value){
		return this.apply_changes(
			ConfigManager.pure.set_config(this.default_config, this.config, key, value)
		);
	},
	set_default_config: function(key, value){
		return this.apply_changes(
			ConfigManager.pure.set_default_config(this.default_config, this.config, key, value)
		);
	},
	get_configuration: function(key){
		return ConfigManager.pure.get_configuration(this.default_config, this.config, key);
	},
	modify_config: function(is_default_config, key, value){
		return this.apply_changes(
			ConfigManager.pure.modify_config(this.default_config, this.config, is_default_config, key, value)
		);
	},
};

ConfigManager.prototype.get_config = ConfigManager.prototype.get_configuration;

module.exports = ConfigManager;
